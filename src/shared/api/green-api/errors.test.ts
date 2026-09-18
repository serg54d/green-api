import {getConnectionErrorMessage} from './errors';

describe('connection errors', () => {
  it.each([new Error('secret-token'), new TypeError('secret-token'), null])(
    'uses a safe fallback for a non-Axios error: %p',
    error => {
      expect(getConnectionErrorMessage(error)).toBe(
        'Не удалось проверить подключение. Попробуйте ещё раз.',
      );
    },
  );

  it.each([
    [401, 'подтвердить доступ'],
    [403, 'подтвердить доступ'],
    [429, 'Слишком много запросов'],
    [500, 'GREEN-API вернул ошибку'],
  ])('handles HTTP %s without leaking response details', (status, message) => {
    const result = getConnectionErrorMessage({
      isAxiosError: true,
      response: {status, data: 'secret-token'},
      message: 'secret-token',
    });
    expect(result).toContain(message);
    expect(result).not.toContain('secret-token');
  });

  it('distinguishes timeout and network failure', () => {
    expect(getConnectionErrorMessage({isAxiosError: true, code: 'ECONNABORTED'})).toContain(
      'вовремя',
    );
    expect(getConnectionErrorMessage({isAxiosError: true, code: 'ERR_NETWORK'})).toContain('сеть');
  });
});
