# Авторизация GREEN-API

Модуль хранит состояние подключения к GREEN-API и предоставляет его всему приложению:
- проверяет `idInstance` и `apiTokenInstance`
- проверяет состояние инстанса через `GetStateInstance`
- хранит реквизиты только после успешной проверки
- сообщает UI о состояниях `connecting / connected / disconnected`
- отменяет устаревшие запросы при выходе или новом подключении

Реквизиты хранятся только в памяти приложения. `localStorage` и другие постоянные хранилища модуль не использует.

---

## 1. AuthStore

Основное состояние находится в `model/AuthStore.ts`:

```ts
status: 'disconnected' | 'connecting' | 'connected';
credentials: Credentials | null;
error: string | null;
instanceState: string | null;
```

`isAuthorized` вычисляется из `status`:

```ts
get isAuthorized() {
    return this.status === 'connected';
}
```

`credentials` появляются только после ответа GREEN-API со состоянием `authorized`.

---

## 2. Подключение

Страница подключения вызывает:

```ts
await authStore.connect({
    idInstance,
    apiTokenInstance,
});
```

`connect` выполняет `authApi.getStateInstance()`:

```text
idInstance + apiTokenInstance
        ↓
AuthStore.connect
        ↓
authApi.getStateInstance
        ↓
GREEN-API GetStateInstance
        ↓
stateInstance
```

Если GREEN-API возвращает:

```text
authorized
```

store сохраняет реквизиты и переводит состояние в `connected`.

Для остальных состояний подключение не считается успешным:
- `notAuthorized` — инстанс нужно авторизовать в GREEN-API
- `starting` — инстанс еще запускается
- `blocked` — аккаунт заблокирован
- неизвестное состояние — инстанс пока недоступен

Текст для этих состояний формируется в `shared/api/green-api/errors.ts`.

---

## 3. Отмена и защита от устаревших ответов

Каждая попытка подключения получает свой `AbortController`.

Это защищает от двух ситуаций:

```text
connect запущен
↓
пользователь нажал Выход
↓
старый HTTP-запрос завершился позже
```

и:

```text
старое подключение еще выполняется
↓
началось новое подключение
↓
старый ответ пришел позже нового
```

Перед применением ответа store проверяет, что ответ относится к текущему controller:

```ts
if (this.controller !== controller || controller.signal.aborted) {
    return false;
}
```

Поэтому поздний ответ не может восстановить старую авторизацию.

---

## 4. Ошибки подключения

Сетевые и HTTP-ошибки преобразуются в пользовательский текст через `getConnectionErrorMessage`.

Примеры:
- `401 / 403` — проверить `idInstance` и `apiTokenInstance`
- `429` — слишком много запросов
- timeout — сервер не ответил вовремя
- нет ответа — проблема сети или доступности GREEN-API
- остальные HTTP-ошибки — общая ошибка GREEN-API

Сам `authApi` не решает, какой текст показывать. Он только выполняет HTTP-запрос и передает ошибку в `AuthStore`.

---

## 5. AuthProvider и useAuth

`AuthProvider` создает один экземпляр `AuthStore`:

```tsx
<AuthContext.Provider value={authStore}>
    {children}
</AuthContext.Provider>
```

В приложении provider подключен в root layout выше `ChatProvider`:

```text
AuthProvider
    ↓
ChatProvider
    ↓
AppLayout
```

Это важно: `ChatStore` получает текущие credentials именно из `AuthStore`.

В компонентах доступ к store идет через:

```ts
const authStore = useAuth();
```

Если `useAuth` вызвать вне `AuthProvider`, хук выбросит ошибку.

---

## 6. Выход

`logout()`:
- отменяет текущую попытку подключения
- удаляет credentials
- очищает ошибку и `instanceState`
- возвращает `status` в `disconnected`

Изменение credentials также замечает `ChatProvider`, поэтому при выходе сбрасываются чаты, polling и незавершенные запросы сообщений.

---

## 7. Защита страницы чатов

Сам `shared/auth` не содержит route-логики.

Защита `/chat` находится на уровне `app`:

```text
app/(router)/chat/layout.tsx
        ↓
AuthGuard
        ↓
isAuthorized ? children : экран входа
```

Так `shared/auth` остается общим модулем состояния, а решение о доступе к конкретному route остается в `app`.

---

## 8. Файлы

```text
shared/auth/
├── api/
│   ├── authApi.ts              — запрос GetStateInstance
│   └── authApi.test.ts         — тест API-слоя и AbortSignal
├── model/
│   ├── AuthStore.ts            — MobX store подключения
│   └── AuthStore.test.ts       — тесты состояний, ошибок и race-condition
├── AuthProvider.tsx            — создание AuthStore и React Context
├── useAuth.ts                  — доступ к AuthStore из компонентов
├── index.ts                    — публичный экспорт модуля
└── README.md
```

---

## 9. Что не делать

- Не сохранять `apiTokenInstance` в `localStorage` без отдельного требования.
- Не использовать credentials до успешного `stateInstance === 'authorized'`.
- Не выполнять запросы GREEN-API напрямую из формы подключения — форма работает через `AuthStore`.
- Не дублировать состояние авторизации в страницах или компонентах.
- Не считать наличие `idInstance` и токена достаточным признаком авторизации: состояние всегда проверяется через GREEN-API.

---

## 10. Тесты

Покрыты сценарии:
- успешное подключение
- logout и очистка credentials
- `notAuthorized / starting / blocked / unknown`
- ошибка запроса и повторная попытка
- повторный submit во время `connecting`
- отмена запроса при logout
- игнорирование позднего ответа старого подключения
- передача `AbortSignal` в API

Точечный запуск:

```bash
npm test -- src/shared/auth
```
