import {waitFor} from '@testing-library/react';
import {chatApi, type NotificationBody, type ReceiveNotificationResponse} from '../api/chatApi';
import {ChatStore} from './ChatStore';

jest.mock('../api/chatApi', () => ({
  chatApi: {
    checkAccount: jest.fn(),
    sendMessage: jest.fn(),
    receiveNotification: jest.fn(),
    deleteNotification: jest.fn(),
    getSettings: jest.fn(),
  },
}));

const credentials = {idInstance: '123', apiTokenInstance: 'token'};
const incoming: NotificationBody = {
  typeWebhook: 'incomingMessageReceived',
  idMessage: 'incoming-1',
  timestamp: 1763115112,
  senderData: {chatId: 'chat-1', chatName: 'Собеседник'},
  messageData: {typeMessage: 'textMessage', textMessageData: {textMessage: 'Привет'}},
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return {promise, resolve};
}

describe('Отправка и очередь уведомлений', () => {
  let store: ChatStore;
  beforeEach(async () => {
    jest.resetAllMocks();
    store = new ChatStore(() => credentials);
    jest
      .mocked(chatApi.checkAccount)
      .mockResolvedValue({exist: true, chatId: 'chat-1', fromCache: false});
    jest.mocked(chatApi.getSettings).mockResolvedValue({
      webhookUrl: '',
      incomingWebhook: 'yes',
      outgoingWebhook: 'yes',
      outgoingMessageWebhook: 'yes',
      outgoingAPIMessageWebhook: 'yes',
    });
    jest.mocked(chatApi.deleteNotification).mockResolvedValue({result: true, reason: ''});
    jest.mocked(chatApi.receiveNotification).mockImplementation(() => new Promise(() => {}));
    await store.createChat('79991234567');
  });
  afterEach(() => {
    store.reset();
    jest.useRealTimers();
  });

  it.each([
    ['receiveNotification', 401],
    ['receiveNotification', 403],
    ['deleteNotification', 401],
    ['deleteNotification', 403],
    ['getSettings', 401],
    ['getSettings', 403],
  ] as const)('останавливает оба цикла после %s с HTTP %s', async (method, status) => {
    jest.useFakeTimers();
    if (method === 'deleteNotification') {
      jest
        .mocked(chatApi.receiveNotification)
        .mockResolvedValueOnce({receiptId: 1, body: incoming});
    }
    jest.mocked(chatApi[method]).mockRejectedValueOnce({isAxiosError: true, response: {status}});
    store.startPolling();
    await jest.advanceTimersByTimeAsync(60000);
    expect(chatApi.receiveNotification).toHaveBeenCalledTimes(1);
    expect(chatApi.getSettings).toHaveBeenCalledTimes(1);
    expect(jest.mocked(chatApi.receiveNotification).mock.calls[0][1]?.aborted).toBe(true);
    expect(store.pollingError).toContain('выйдите и подключитесь заново');
    expect(store.chats).toHaveLength(1);
    expect(jest.getTimerCount()).toBe(0);
  });

  it.each([429, 500, 502])('повторяет polling после временной HTTP ошибки %s', async (status) => {
    jest.useFakeTimers();
    jest
      .mocked(chatApi.receiveNotification)
      .mockRejectedValueOnce({isAxiosError: true, response: {status}})
      .mockResolvedValueOnce({receiptId: 1, body: incoming});
    store.startPolling();
    await jest.advanceTimersByTimeAsync(1500);
    expect(store.activeChat?.messages[0].text).toBe('Привет');
    expect(store.pollingError).toBeNull();
  });

  it('отменяет ожидание повторных запросов при выходе', async () => {
    jest.useFakeTimers();
    jest.mocked(chatApi.receiveNotification).mockRejectedValueOnce(new Error('Network error'));
    jest.mocked(chatApi.getSettings).mockRejectedValueOnce(new Error('Network error'));
    store.startPolling();
    await jest.advanceTimersByTimeAsync(0);
    expect(jest.getTimerCount()).toBe(2);
    store.reset();
    expect(jest.getTimerCount()).toBe(0);
    await jest.advanceTimersByTimeAsync(60000);
    expect(chatApi.receiveNotification).toHaveBeenCalledTimes(1);
    expect(chatApi.getSettings).toHaveBeenCalledTimes(1);
  });

  it('не запускает второй цикл и игнорирует отказ от старого подключения', async () => {
    const oldResponse = deferred<ReceiveNotificationResponse | null>();
    jest.mocked(chatApi.receiveNotification).mockReturnValueOnce(oldResponse.promise);
    store.startPolling();
    store.startPolling();
    expect(chatApi.receiveNotification).toHaveBeenCalledTimes(1);
    store.reset();
    store.startPolling();
    oldResponse.resolve({receiptId: 1, body: incoming});
    await Promise.resolve();
    expect(chatApi.receiveNotification).toHaveBeenCalledTimes(2);
    expect(chatApi.deleteNotification).not.toHaveBeenCalled();
    expect(store.pollingError).toBeNull();
  });

  it('показывает отправку, очищает черновик и сохраняет id без ложного статуса доставки', async () => {
    const response = deferred<{idMessage: string}>();
    jest.mocked(chatApi.sendMessage).mockReturnValue(response.promise);
    store.setDraft('chat-1', 'Привет');
    const sending = store.sendMessage('chat-1', 'Привет');
    expect(store.activeChat?.messages[0].status).toBe('sending');
    expect(store.getDraft('chat-1')).toBe('');
    expect(await store.sendMessage('chat-1', 'Дубль')).toBe(false);
    response.resolve({idMessage: 'sent-1'});
    expect(await sending).toBe(true);
    expect(store.activeChat?.messages[0]).toMatchObject({idMessage: 'sent-1', status: 'queued'});
    expect(chatApi.sendMessage).toHaveBeenCalledTimes(1);
  });

  it('не отправляет пустой и слишком длинный текст', async () => {
    expect(await store.sendMessage('chat-1', ' \n')).toBe(false);
    expect(await store.sendMessage('chat-1', 'x'.repeat(4001))).toBe(false);
    expect(chatApi.sendMessage).not.toHaveBeenCalled();
  });

  it('сохраняет ранний статус прочтения и не понижает его до доставки', async () => {
    const response = deferred<{idMessage: string}>();
    jest.mocked(chatApi.sendMessage).mockReturnValue(response.promise);
    const sending = store.sendMessage('chat-1', 'Привет');
    jest
      .mocked(chatApi.receiveNotification)
      .mockResolvedValueOnce({
        receiptId: 1,
        body: {typeWebhook: 'outgoingMessageStatus', idMessage: 'sent-1', status: 'read'},
      })
      .mockResolvedValueOnce({
        receiptId: 2,
        body: {typeWebhook: 'outgoingMessageStatus', idMessage: 'sent-1', status: 'delivered'},
      });
    store.startPolling();
    await waitFor(() => expect(chatApi.deleteNotification).toHaveBeenCalledTimes(2));
    response.resolve({idMessage: 'sent-1'});
    await sending;
    expect(store.activeChat?.messages[0].status).toBe('read');
  });

  it('добавляет входящий текст до подтверждения и не дублирует повторное событие', async () => {
    jest
      .mocked(chatApi.receiveNotification)
      .mockResolvedValueOnce({receiptId: 1, body: incoming})
      .mockResolvedValueOnce({receiptId: 1, body: incoming});
    jest.mocked(chatApi.deleteNotification).mockImplementation(async () => {
      expect(store.activeChat?.messages).toHaveLength(1);
      expect(store.activeChat?.messages[0]).toMatchObject({text: 'Привет', direction: 'incoming'});
      return {result: true, reason: ''};
    });
    store.startPolling();
    await waitFor(() => expect(chatApi.deleteNotification).toHaveBeenCalledTimes(2));
  });

  it('создаёт чат для нового отправителя и сохраняет текст со ссылкой', async () => {
    jest.mocked(chatApi.receiveNotification).mockResolvedValueOnce({
      receiptId: 1,
      body: {
        ...incoming,
        senderData: {chatId: 'new-chat', chatName: 'Новый собеседник'},
        messageData: {
          typeMessage: 'extendedTextMessage',
          extendedTextMessageData: {text: 'https://example.com'},
        },
      },
    });
    store.startPolling();
    await waitFor(() => expect(chatApi.deleteNotification).toHaveBeenCalledTimes(1));
    expect(store.chats[1]).toMatchObject({
      id: 'new-chat',
      title: 'Новый собеседник',
      messages: [{text: 'https://example.com'}],
    });
    expect(store.activeChatId).toBe('chat-1');
  });

  it.each<NotificationBody>([
    {typeWebhook: 'incomingMessageReceived'},
    {...incoming, messageData: {typeMessage: 'textMessage'}},
    {...incoming, messageData: {typeMessage: 'extendedTextMessage'}},
  ])(
    'пропускает повреждённое событие с предупреждением и обрабатывает следующее: %j',
    async (body) => {
      jest
        .mocked(chatApi.receiveNotification)
        .mockResolvedValueOnce({receiptId: 1, body})
        .mockResolvedValueOnce({receiptId: 2, body: incoming});
      store.startPolling();
      await waitFor(() => expect(chatApi.deleteNotification).toHaveBeenCalledTimes(2));
      expect(jest.mocked(chatApi.deleteNotification).mock.calls.map((call) => call[1])).toEqual([
        1, 2,
      ]);
      expect(store.activeChat?.messages).toHaveLength(1);
      expect(store.activeChat?.messages[0].text).toBe('Привет');
      expect(store.notificationWarning).toContain('Проверьте переписку в MAX');
      expect(store.pollingError).toBeNull();
      store.reset();
      expect(store.notificationWarning).toBeNull();
    },
  );

  it('повторяет получение при сетевой ошибке без подтверждения не полученного события', async () => {
    jest.useFakeTimers();
    jest
      .mocked(chatApi.receiveNotification)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({receiptId: 2, body: incoming});
    store.startPolling();
    await jest.advanceTimersByTimeAsync(0);
    expect(chatApi.deleteNotification).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(1500);
    expect(chatApi.deleteNotification).toHaveBeenCalledTimes(1);
    expect(store.activeChat?.messages[0].text).toBe('Привет');
    expect(store.notificationWarning).toBeNull();
  });

  it('сбрасывает последовательные ошибки после успешного цикла', async () => {
    jest.useFakeTimers();
    jest
      .mocked(chatApi.receiveNotification)
      .mockRejectedValueOnce(new Error())
      .mockRejectedValueOnce(new Error())
      .mockResolvedValueOnce(null)
      .mockRejectedValueOnce(new Error());
    store.startPolling();
    await jest.advanceTimersByTimeAsync(3000);
    expect(store.pollingError).toBeNull();
    store.reset();
    await jest.advanceTimersByTimeAsync(1500);
  });

  it('не повторяет отправку при неопределённом результате', async () => {
    jest
      .mocked(chatApi.sendMessage)
      .mockRejectedValue({isAxiosError: true, response: {status: 504}});
    expect(await store.sendMessage('chat-1', 'Привет')).toBe(false);
    expect(store.activeChat?.messages[0].status).toBe('unknown');
    expect(chatApi.sendMessage).toHaveBeenCalledTimes(1);
  });

  it('игнорирует поздние ответы после сброса и отменяет запросы', async () => {
    const response = deferred<{idMessage: string}>();
    const notification = deferred<ReceiveNotificationResponse | null>();
    jest.mocked(chatApi.sendMessage).mockReturnValue(response.promise);
    jest.mocked(chatApi.receiveNotification).mockReturnValue(notification.promise);
    const sending = store.sendMessage('chat-1', 'Привет');
    store.startPolling();
    store.reset();
    expect(jest.mocked(chatApi.sendMessage).mock.calls[0][3]?.aborted).toBe(true);
    expect(jest.mocked(chatApi.receiveNotification).mock.calls[0][1]?.aborted).toBe(true);
    response.resolve({idMessage: 'sent-1'});
    notification.resolve({receiptId: 1, body: incoming});
    await sending;
    expect(store.chats).toEqual([]);
    expect(chatApi.deleteNotification).not.toHaveBeenCalled();
  });
});
