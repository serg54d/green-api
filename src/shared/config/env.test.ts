import {env} from './env';

describe('greenApiUrl', () => {
  const original = process.env.NEXT_PUBLIC_GREEN_API_URL;
  afterEach(() => {
    if (original === undefined) delete process.env.NEXT_PUBLIC_GREEN_API_URL;
    else process.env.NEXT_PUBLIC_GREEN_API_URL = original;
  });

  it('требует указать URL', () => {
    delete process.env.NEXT_PUBLIC_GREEN_API_URL;
    expect(() => env.greenApiUrl).toThrow('GREEN_API_URL_MISSING');
  });

  it('требует протокол HTTPS', () => {
    process.env.NEXT_PUBLIC_GREEN_API_URL = 'http://example.com';
    expect(() => env.greenApiUrl).toThrow('GREEN_API_URL_HTTPS_REQUIRED');
  });

  it('сохраняет заданный HTTPS URL', () => {
    process.env.NEXT_PUBLIC_GREEN_API_URL = 'https://3100.api.green-api.com/';
    expect(env.greenApiUrl).toBe('https://3100.api.green-api.com/');
  });
});
