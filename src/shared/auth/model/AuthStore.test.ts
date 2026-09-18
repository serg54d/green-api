import {authApi} from '@/shared/api/green-api/authApi';
import {AuthStore} from './AuthStore';

jest.mock('@/shared/api/green-api/authApi', () => ({authApi: {getStateInstance: jest.fn()}}));
const request = jest.mocked(authApi.getStateInstance);
const credentials = {idInstance: '123', apiTokenInstance: 'test-token'};

describe('AuthStore', () => {
  beforeEach(() => request.mockReset());

  it('starts disconnected, connects and clears credentials on logout', async () => {
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
    'rejects state %s',
    async (stateInstance) => {
      request.mockResolvedValue({stateInstance});
      const store = new AuthStore();
      expect(await store.connect(credentials)).toBe(false);
      expect(store.status).toBe('disconnected');
      expect(store.credentials).toBeNull();
      expect(store.error).toBeTruthy();
    },
  );

  it('handles failure and permits another attempt', async () => {
    request.mockRejectedValueOnce(new Error('failure'));
    request.mockResolvedValueOnce({stateInstance: 'authorized'});
    const store = new AuthStore();
    expect(await store.connect(credentials)).toBe(false);
    expect(store.error).toBeTruthy();
    expect(await store.connect(credentials)).toBe(true);
    expect(store.error).toBeNull();
  });

  it('ignores repeated clicks and late success after logout', async () => {
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

  it('does not overwrite a new connection with an old response', async () => {
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
