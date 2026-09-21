# Чаты MAX через GREEN-API

Модуль реализует основной экран мессенджера:
- создание чата по номеру телефона
- выбор активного чата
- отдельные черновики для каждого чата
- отправку текстовых сообщений
- статусы `sending / queued / delivered / read`
- получение входящих сообщений через HTTP API
- long polling очереди уведомлений GREEN-API
- диагностику неправильных настроек уведомлений

Основная цепочка данных:

```text
UI-компоненты
    ↓
ChatStore
    ↓
chatApi
    ↓
GREEN-API
```

Компоненты не выполняют HTTP-запросы напрямую.

---

## 1. Модель чата

```ts
interface Chat {
    id: string;
    title?: string;
    phoneNumber: string;
    messages: ChatMessage[];
}
```

`id` — `chatId`, полученный от GREEN-API.

Для чата, созданного пользователем, основным отображаемым значением остается номер телефона. Для входящего нового чата может использоваться `chatName` из уведомления.

Сообщение:

```ts
interface ChatMessage {
    id: string;
    idMessage?: string;
    text: string;
    time: string;
    direction: 'incoming' | 'outgoing';
    status?: MessageStatus;
    error?: string;
}
```

У исходящего сообщения есть два идентификатора:
- `id` — локальный ID, создается сразу и используется как React key
- `idMessage` — серверный ID GREEN-API, появляется после успешного `SendMessage`

---

## 2. Создание чата

Новый чат создается через `NewChatModal`.

Форма принимает номера России и Беларуси:

```text
+7 ...
8 ...  -> нормализуется в 7...
+375 ...
```

Поток:

```text
номер телефона
    ↓
normalizePhoneNumber
    ↓
isSupportedPhoneNumber
    ↓
chatApi.checkAccount
    ↓
GREEN-API CheckAccount
    ↓
chatId
    ↓
ChatStore.chats
```

Перед запросом store проверяет дубликат по нормализованному номеру. После ответа дополнительно проверяется дубликат по `chatId`.

Если чат уже существует, новый элемент не создается — существующий чат просто становится активным.

Закрытие модалки отменяет незавершенный `CheckAccount` через `AbortController`.

---

## 3. Активный чат и черновики

`activeChatId` хранит выбранный чат, а getter `activeChat` возвращает его объект.

Черновики хранятся отдельно по `chatId`:

```ts
drafts = new Map<string, string>();
```

Поэтому переключение между чатами не удаляет недописанный текст:

```text
чат A -> "Привет..."
чат B -> "Созвонимся завтра?"
```

После добавления исходящего сообщения черновик конкретного чата очищается.

---

## 4. Отправка сообщения

`MessageComposer` поддерживает:
- `Enter` — отправить
- `Shift + Enter` — перенос строки
- максимум 4000 символов
- запрет пустого текста

Отправка оптимистическая: сообщение появляется в UI до завершения HTTP-запроса.

```text
sendMessage(chatId, text)
        ↓
локальный пузырь
status = sending
        ↓
chatApi.sendMessage
        ↓
GREEN-API SendMessage
        ↓
idMessage
        ↓
status = queued
```

`queued` означает только то, что GREEN-API принял сообщение в очередь. Это не подтверждение доставки получателю.

Пока один `SendMessage` для чата выполняется, повторная отправка в этот же чат блокируется через `sendingChatIds`. Печатать следующий текст при этом можно.

---

## 5. Ошибки отправки

Ошибки преобразуются в `api/errors.ts`.

Есть принципиальное различие между `error` и `unknown`.

### `error`

GREEN-API явно ответил отказом, например:
- `400`
- `403`
- `429`

В этом случае сообщение получает:

```ts
status = 'error';
```

### `unknown`

Нет достоверного подтверждения результата:
- сетевой сбой
- timeout
- `408`
- `5xx`

Сервер мог успеть принять сообщение, даже если ответ не дошел до браузера. Поэтому UI показывает:

```text
Не удалось подтвердить отправку
```

Автоматический повтор отправки не выполняется, чтобы не создать дубликат.

---

## 6. Статусы доставки

После `SendMessage` реальный статус приходит отдельным уведомлением `outgoingMessageStatus`.

Поддерживаются:

```text
delivered   -> Доставлено
read        -> Прочитано
failed      -> Ошибка отправки
noAccount   -> Аккаунт MAX не найден
notInGroup  -> Нет доступа к чату
```

Связь выполняется по `idMessage`:

```text
SendMessage
    ↓
idMessage = 123

ReceiveNotification
    ↓
idMessage = 123, status = read
    ↓
находим локальное сообщение
    ↓
status = read
```

`read` не понижается обратно до `delivered`, даже если события пришли в неожиданном порядке.

---

## 7. Ранний статус и pendingStatuses

Возможна гонка:

```text
GREEN-API уже создал сообщение
        ↓
outgoingMessageStatus пришел в polling
        ↓
HTTP-ответ SendMessage с idMessage еще не вернулся
```

В этот момент локальное сообщение еще не знает свой `idMessage`.

Для этого store временно хранит статусы:

```ts
pendingStatuses = new Map<idMessage, statuses[]>();
```

Когда `SendMessage` возвращает `idMessage`, накопленные статусы применяются к сообщению.

Так ранний `delivered` или `read` не теряется.

---

## 8. Получение уведомлений

`ChatStore.startPolling()` запускает long polling через `ReceiveNotification`.

Это не `setInterval`: HTTP-запрос сам ожидает событие до `receiveTimeout`.

```text
ReceiveNotification
        ↓
есть событие?
├─ нет -> следующий ReceiveNotification
└─ да
    ↓
handleNotification
    ↓
DeleteNotification(receiptId)
    ↓
следующий ReceiveNotification
```

После обработки событие обязательно подтверждается через `DeleteNotification`. Иначе очередь может снова вернуть то же уведомление.

Если `DeleteNotification` вернул `result: false`, цикл считает это ошибкой и повторяет попытку получения позже.

После трех последовательных ошибок polling показывает `pollingError`. После успешного цикла счетчик ошибок и alert сбрасываются.

---

## 9. Проверка настроек GREEN-API

При старте polling параллельно вызывается `GetSettings`.

Проверяются:
- `webhookUrl` должен быть пустым для текущего HTTP API сценария
- `incomingWebhook === 'yes'`
- `outgoingMessageWebhook === 'yes'`
- `outgoingAPIMessageWebhook === 'yes'`
- `outgoingWebhook === 'yes'`

Если настройки неправильные, `ChatPage` показывает предупреждение.

Пока проблема существует, `GetSettings` перепроверяется раз в 15 секунд:

```text
неправильные settings
    ↓
warning
    ↓
15 секунд
    ↓
GetSettings
    ↓
исправлены?
├─ нет -> повторить через 15 секунд
└─ да -> убрать warning и остановить проверки
```

Если настройки были корректны сразу, постоянного polling `GetSettings` нет.

---

## 10. Входящие сообщения

Событие `incomingMessageReceived` обрабатывается тем же polling.

Поддерживаются:
- `textMessage`
- `extendedTextMessage`

Если сообщение относится к существующему `chatId`, оно добавляется в этот чат.

Если чат еще не существует, он создается автоматически из `senderData`:

```text
incomingMessageReceived
        ↓
chatId отсутствует в chats
        ↓
создать Chat
        ↓
добавить incoming message
```

Повторное уведомление не создает дубликат: сообщения проверяются по `idMessage`.

Для неподдерживаемого типа создается текстовая заглушка:

```text
Сообщение этого типа не поддерживается
```

Если уведомление повреждено и его нельзя корректно разобрать, оно не добавляется в чат, а пользователь видит `notificationWarning`. Событие после этого все равно удаляется из очереди, чтобы одно некорректное уведомление не блокировало последующие.

---

## 11. ChatProvider и жизненный цикл

`ChatStore` создается в:

```text
app/(init)/providers/ChatProvider.tsx
```

Provider находится выше страниц, поэтому переход:

```text
/chat -> /connection -> /chat
```

сам по себе не уничтожает store.

`ChatProvider` следит за `authStore.credentials`:

```text
credentials изменились
        ↓
chatStore.reset()
        ↓
credentials есть?
├─ нет
└─ да -> startPolling()
```

При logout или смене подключения `reset()`:
- останавливает polling
- отменяет создание чата
- отменяет незавершенные отправки
- очищает pending statuses
- очищает drafts
- очищает chats и activeChatId
- убирает warnings/errors

Данные чатов не сохраняются на диск, поэтому после полной перезагрузки приложения состояние начинается заново.

---

## 12. UI-компоненты

```text
ChatPage
├── ChatList
│   └── список чатов + последний текст
├── ChatHeader
│   └── название/номер активного чата
├── MessageList
│   └── входящие/исходящие + статус исходящих
├── MessageComposer
│   └── textarea + отправка
└── NewChatModal
    └── создание чата по номеру
```

`ChatList` и `MessageList` обернуты в `observer`, поэтому MobX-изменения сообщений и статусов отображаются без ручного обновления страницы.

На мобильном выбор чата открывает переписку, а кнопка назад возвращает список.

---

## 13. Файлы

```text
pages/chat/
├── api/
│   ├── chatApi.ts                  — CheckAccount, SendMessage, GetSettings, Receive/DeleteNotification
│   ├── chatApi.test.ts             — тесты API-вызовов
│   ├── errors.ts                   — классификация ошибок SendMessage
│   └── errors.test.ts
├── model/
│   ├── newChatSchema.ts            — yup-схема нового чата
│   ├── phone.ts                    — поддерживаемые телефонные форматы
│   ├── phone.test.ts
│   └── types.ts                    — Chat, ChatMessage, MessageStatus
├── store/
│   ├── ChatStore.ts                — чаты, отправка, polling, входящие, statuses
│   ├── ChatStore.test.ts           — создание/выбор чатов
│   ├── ChatStore.messages.test.ts  — отправка, статусы, входящие, polling
│   ├── ChatContext.ts              — React Context
│   ├── useChat.ts                  — доступ к ChatStore
│   └── index.ts                    — публичный экспорт store
├── ui/
│   ├── ChatHeader.tsx
│   ├── ChatList.tsx
│   ├── MessageComposer.tsx
│   ├── MessageList.tsx
│   ├── MessageList.test.tsx
│   └── NewChatModal.tsx
├── ChatPage.module.scss
├── ChatPage.test.tsx
├── index.tsx                       — сборка страницы
└── README.md
```

`ChatProvider` намеренно находится в `app/(init)/providers`, потому что его жизненный цикл шире одной страницы `/chat`.

---

## 14. Что не делать

- Не вызывать GREEN-API напрямую из `ChatList`, `MessageComposer` или других UI-компонентов.
- Не использовать `activeChatId` после `await` для определения сообщения, которое отправлялось: запрос всегда привязан к переданному `chatId`.
- Не считать `queued` статусом доставки.
- Не превращать timeout/сетевую ошибку автоматически в «Не отправлено».
- Не делать автоматический retry `SendMessage`: неопределенный запрос мог уже быть принят сервером.
- Не удалять `DeleteNotification`: без подтверждения очередь может повторять события.
- Не определять неправильные настройки по пустому `ReceiveNotification`: пустая очередь является нормальным состоянием.

---

## 15. Тесты

Покрыты основные сценарии:
- нормализация и поддерживаемые номера
- успешное создание чата
- дубликаты по номеру и `chatId`
- переключение активного чата
- отмена `CheckAccount`
- `sending -> queued`
- пустой и слишком длинный текст
- ранний `read` до ответа `SendMessage`
- запрет downgrade `read -> delivered`
- `error` и `unknown` для разных ошибок отправки
- входящий текст и `extendedTextMessage`
- дедупликация входящих по `idMessage`
- создание нового чата из входящего события
- поврежденные входящие уведомления
- ошибки polling и восстановление после успешного цикла
- reset и отмена незавершенных запросов

Точечный запуск:

```bash
npm test -- src/pages/chat
```
