import {getSendMessageFailure} from './errors';

describe('Ошибки отправки', () => {
  it.each([408, 500, 502, 503, 504])(
    'не считает HTTP %s доказательством отказа отправки',
    (status) => {
      expect(getSendMessageFailure({isAxiosError: true, response: {status}}).status).toBe(
        'unknown',
      );
    },
  );
  it('не считает сетевой сбой доказательством отказа отправки', () => {
    expect(getSendMessageFailure({isAxiosError: true}).status).toBe('unknown');
  });
  it.each([400, 403, 429])('показывает явную ошибку при HTTP %s', (status) => {
    expect(getSendMessageFailure({isAxiosError: true, response: {status}}).status).toBe('error');
  });
});
