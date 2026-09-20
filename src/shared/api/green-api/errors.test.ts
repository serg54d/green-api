import {getConnectionErrorMessage} from './errors';

describe('Ошибки подключения', () => {
  it.each([new Error('secret-token'), new TypeError('secret-token'), null])(
    'возвращает безопасный текст для ошибки не из Axios: %p',
    (error) => {
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
  ])('обрабатывает HTTP %s без раскрытия содержимого ответа', (status, message) => {
    const result = getConnectionErrorMessage({
      isAxiosError: true,
      response: {status, data: 'secret-token'},
      message: 'secret-token',
    });
    expect(result).toContain(message);
    expect(result).not.toContain('secret-token');
  });

  it('различает таймаут и ошибку сети', () => {
    expect(getConnectionErrorMessage({isAxiosError: true, code: 'ECONNABORTED'})).toContain(
      'вовремя',
    );
    expect(getConnectionErrorMessage({isAxiosError: true, code: 'ERR_NETWORK'})).toContain('сеть');
  });
});
