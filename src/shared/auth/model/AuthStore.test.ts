import {authApi} from '../api/authApi';
import {AuthStore} from './AuthStore';

jest.mock('../api/authApi', () => ({authApi: {getStateInstance: jest.fn()}}));
const request = jest.mocked(authApi.getStateInstance);
const credentials = {idInstance: '123', apiTokenInstance: 'test-token'};

describe('AuthStore', () => {
  beforeEach(() => request.mockReset());

  it('изначально отключён, подключается и очищает реквизиты при выходе', async () => {
    request.mockResolvedValue({stateInstance: 'authorized'});
    const store = new AuthStore();
    expect(store.isAuthorized).toBe(false);
    expect(await store.connect(credentials)).toBe(true);
    expect(store.credentials).toEqual(credentials);
    store.logout();
    expect(store.isAuthorized).toBe(false);
    expect(store.credentials).toBeNull();
    expect(store.error).toBeNull();
  });

  it.each(['notAuthorized', 'starting', 'blocked', 'unexpected'])(
    'отклоняет подключение при состоянии %s',
    async (stateInstance) => {
      request.mockResolvedValue({stateInstance});
      const store = new AuthStore();
      expect(await store.connect(credentials)).toBe(false);
      expect(store.status).toBe('disconnected');
      expect(store.credentials).toBeNull();
      expect(store.error).toBeTruthy();
    },
  );

  it('обрабатывает ошибку и позволяет повторить попытку', async () => {
    request.mockRejectedValueOnce(new Error('failure'));
    request.mockResolvedValueOnce({stateInstance: 'authorized'});
    const store = new AuthStore();
    expect(await store.connect(credentials)).toBe(false);
    expect(store.error).toBeTruthy();
    expect(await store.connect(credentials)).toBe(true);
    expect(store.error).toBeNull();
  });

  it('игнорирует повторные нажатия и поздний успешный ответ после выхода', async () => {
    let resolve!: (value: {stateInstance: string}) => void;
    request.mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const store = new AuthStore();
    const pending = store.connect(credentials);
    expect(store.status).toBe('connecting');
    expect(await store.connect(credentials)).toBe(false);
    expect(request).toHaveBeenCalledTimes(1);
    const signal = request.mock.calls[0][1];
    store.logout();
    expect(signal?.aborted).toBe(true);
    resolve({stateInstance: 'authorized'});
    expect(await pending).toBe(false);
    expect(store.status).toBe('disconnected');
    expect(store.credentials).toBeNull();
  });

  it('не перезаписывает новое подключение устаревшим ответом', async () => {
    let reject!: (error: Error) => void;
    request.mockImplementationOnce(
      () =>
        new Promise((_, fail) => {
          reject = fail;
        }),
    );
    request.mockResolvedValueOnce({stateInstance: 'authorized'});
    const store = new AuthStore();
    const previous = store.connect(credentials);
    store.logout();
    const next = {...credentials, idInstance: '456'};
    await store.connect(next);
    reject(new Error('late failure'));
    await previous;
    expect(store.isAuthorized).toBe(true);
    expect(store.credentials).toEqual(next);
    expect(store.error).toBeNull();
  });
});
