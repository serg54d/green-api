import {chatApi} from '../api/chatApi';

import {ChatStore} from './ChatStore';

jest.mock('../api/chatApi', () => ({
  chatApi: {
    checkAccount: jest.fn(),
  },
}));

const credentials = {
  idInstance: '123456',
  apiTokenInstance: 'token',
};

const createStore = () => {
  return new ChatStore(() => credentials);
};

describe('ChatStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('создает чат и делает его активным', async () => {
    jest.mocked(chatApi.checkAccount).mockResolvedValue({
      exist: true,
      chatId: '6139795',
      fromCache: false,
    });

    const store = createStore();

    const result = await store.createChat('+7 (999) 123-45-67');

    expect(result).toBe(true);

    expect(store.chats).toEqual([
      {
        id: '6139795',
        phoneNumber: '79991234567',
        messages: [],
      },
    ]);

    expect(store.activeChatId).toBe('6139795');
    expect(store.activeChat).toEqual(store.chats[0]);
  });

  it('не создает дубль по номеру', async () => {
    jest.mocked(chatApi.checkAccount).mockResolvedValue({
      exist: true,
      chatId: '6139795',
      fromCache: false,
    });

    const store = createStore();

    await store.createChat('+7 999 123-45-67');
    await store.createChat('8 999 123 45 67');

    expect(store.chats).toHaveLength(1);

    expect(chatApi.checkAccount).toHaveBeenCalledTimes(1);
    expect(store.activeChatId).toBe('6139795');
  });

  it('не создает дубль по chatId', async () => {
    jest
      .mocked(chatApi.checkAccount)
      .mockResolvedValueOnce({
        exist: true,
        chatId: '6139795',
        fromCache: false,
      })
      .mockResolvedValueOnce({
        exist: true,
        chatId: '6139795',
        fromCache: false,
      });

    const store = createStore();

    await store.createChat('79991234567');
    await store.createChat('79997654321');

    expect(store.chats).toHaveLength(1);
    expect(store.activeChatId).toBe('6139795');
  });

  it('переключает активный чат', async () => {
    jest
      .mocked(chatApi.checkAccount)
      .mockResolvedValueOnce({
        exist: true,
        chatId: '111',
        fromCache: false,
      })
      .mockResolvedValueOnce({
        exist: true,
        chatId: '222',
        fromCache: false,
      });

    const store = createStore();

    await store.createChat('79991234567');
    await store.createChat('79997654321');

    store.selectChat('111');

    expect(store.activeChatId).toBe('111');
    expect(store.activeChat?.phoneNumber).toBe('79991234567');
  });

  it('не переключается на несуществующий чат', async () => {
    jest.mocked(chatApi.checkAccount).mockResolvedValue({
      exist: true,
      chatId: '111',
      fromCache: false,
    });

    const store = createStore();

    await store.createChat('79991234567');

    store.selectChat('unknown');

    expect(store.activeChatId).toBe('111');
  });

  it('показывает ошибку если аккаунт MAX не найден', async () => {
    jest.mocked(chatApi.checkAccount).mockResolvedValue({
      exist: false,
      chatId: '',
      fromCache: false,
    });

    const store = createStore();

    const result = await store.createChat('79991234567');

    expect(result).toBe(false);
    expect(store.chats).toHaveLength(0);
    expect(store.error).toBe('Аккаунт MAX для этого номера не найден');
  });

  it('обрабатывает ошибку GREEN-API', async () => {
    jest.mocked(chatApi.checkAccount).mockResolvedValue({
      status: false,
      reason: 'Instance is not ready',
    });

    const store = createStore();

    const result = await store.createChat('79991234567');

    expect(result).toBe(false);
    expect(store.chats).toHaveLength(0);
    expect(store.error).toBe('Instance is not ready');
  });

  it('не делает запрос без credentials', async () => {
    const store = new ChatStore(() => null);

    const result = await store.createChat('79991234567');

    expect(result).toBe(false);

    expect(chatApi.checkAccount).not.toHaveBeenCalled();

    expect(store.error).toBe('Нет активного подключения к GREEN-API');
  });

  it('отменяет создание чата', async () => {
    jest.mocked(chatApi.checkAccount).mockImplementation(
      (_, __, signal) =>
        new Promise((resolve) => {
          signal?.addEventListener('abort', () => {
            resolve({
              exist: true,
              chatId: '6139795',
              fromCache: false,
            });
          });
        }),
    );

    const store = createStore();

    const promise = store.createChat('79991234567');

    expect(store.isCreating).toBe(true);

    store.cancelCreateChat();

    await promise;

    expect(store.isCreating).toBe(false);
    expect(store.chats).toHaveLength(0);
    expect(store.activeChatId).toBeNull();
  });

  it('очищает состояние', async () => {
    jest.mocked(chatApi.checkAccount).mockResolvedValue({
      exist: true,
      chatId: '6139795',
      fromCache: false,
    });

    const store = createStore();

    await store.createChat('79991234567');

    store.reset();

    expect(store.chats).toEqual([]);
    expect(store.activeChatId).toBeNull();
    expect(store.isCreating).toBe(false);
    expect(store.error).toBeNull();
  });
});
