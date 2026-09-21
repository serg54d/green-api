# Страница подключения к GREEN-API

Страница отвечает только за UI входа и выхода:
- ввод `idInstance` и `apiTokenInstance`
- валидацию формы
- запуск подключения через `shared/auth`
- отображение ошибок состояния инстанса
- переход в `/chat` после успешного подключения
- выход из текущего аккаунта

Собственного store и API-клиента у страницы нет. Состояние авторизации находится в `shared/auth`.

---

## 1. Форма подключения

Форма построена на `react-hook-form` и `yup`.

Схема находится в `model/connectionSchema.ts`:

```ts
idInstance: string;       // обязательный, только цифры
apiTokenInstance: string; // обязательный
```

До успешной валидации запрос в GREEN-API не выполняется.

---

## 2. Вход

После submit страница вызывает:

```ts
const connected = await authStore.connect(values);
```

Если подключение успешно:

```ts
reset();
router.replace('/chat');
```

Полный поток:

```text
ConnectionPage
    ↓
react-hook-form + yup
    ↓
authStore.connect
    ↓
GetStateInstance
    ↓
authorized
    ↓
router.replace('/chat')
```

Пока запрос выполняется:
- кнопка показывает loading
- поля отключены
- повторная отправка формы блокируется

---

## 3. Состояние notAuthorized

Если credentials корректны, но сам инстанс GREEN-API еще не авторизован, `AuthStore` сохраняет:

```text
instanceState = notAuthorized
```

В этом случае страница показывает отдельное пояснение и ссылку:

```text
Открыть GREEN-API
```

Она ведет в личный кабинет GREEN-API, где пользователь может авторизовать инстанс.

Для остальных ошибок (`starting`, `blocked`, сеть, неправильный токен) используется обычный error-state без этой ссылки.

---

## 4. Авторизованное состояние и выход

Когда `authStore.isAuthorized === true`, форма входа скрывается.

Страница показывает:
- состояние «Вы авторизованы»
- пояснение о смене аккаунта
- кнопку `Выйти`

Выход выполняет:

```ts
authStore.logout();
reset();
router.replace('/connection');
```

`logout` также приводит к сбросу `ChatStore` через общий `ChatProvider`.

---

## 5. Адаптивное поведение

Страница визуально разделена на:
- список настроек
- содержимое выбранного пункта

На мобильном используется `isMobileContentOpen`:

```text
Настройки
    ↓ нажали Вход / Выход
форма или состояние аккаунта
    ↓ Назад
Настройки
```

Закрытие мобильного содержимого не сбрасывает введенные значения формы.

---

## 6. Зависимости

Страница использует:

```text
shared/auth
    ├── useAuth
    └── AuthStore

react-hook-form
    ↓
yupResolver
    ↓
connectionSchema

Next Router
    ├── /chat
    └── /connection
```

Важно: `ConnectionPage` не знает деталей HTTP-запроса `GetStateInstance`. Этим занимается `shared/auth/api/authApi.ts`.

---

## 7. Файлы

```text
pages/connection/
├── model/
│   └── connectionSchema.ts       — yup-схема формы подключения
├── ConnectionPage.module.scss    — стили desktop/mobile состояний
├── ConnectionPage.test.tsx       — UI и integration-тесты с AuthProvider
├── index.tsx                     — страница входа/выхода
└── README.md
```

Папки `api`, `store` и `ui` сейчас не содержат собственной логики: API и состояние авторизации вынесены в `shared/auth`, а страница пока достаточно небольшая, чтобы не дробить UI дополнительно.

---

## 8. Что не делать

- Не хранить credentials локально в `ConnectionPage` после submit.
- Не вызывать GREEN-API напрямую из компонента.
- Не создавать второй auth store для страницы.
- Не переходить в `/chat`, если `authStore.connect()` вернул `false`.
- Не показывать ссылку авторизации GREEN-API для любой ошибки: она нужна только для `notAuthorized`.

---

## 9. Тесты

Покрыты сценарии:
- рендер формы
- открытие/закрытие мобильного пункта без потери введенных данных
- успешный вход и переход в `/chat`
- logout и возврат формы
- валидация обязательных полей до API
- `notAuthorized` со ссылкой на GREEN-API
- повторное подключение после авторизации инстанса
- `starting / blocked / network / invalid-token`

Точечный запуск:

```bash
npm test -- src/pages/connection
```
