import {greenApiClient} from './client';

jest.mock('@/shared/config/env', () => ({
  env: {greenApiUrl: 'https://3100.api.green-api.com'},
}));

describe('greenApiClient', () => {
  it('задаёт общий базовый URL и таймаут для запросов', () => {
    expect(greenApiClient.defaults.baseURL).toBe('https://3100.api.green-api.com');
    expect(greenApiClient.defaults.timeout).toBe(20_000);
    expect(greenApiClient.getUri({url: '/waInstance123/getStateInstance/token'})).toBe(
      'https://3100.api.green-api.com/waInstance123/getStateInstance/token',
    );
  });
});
