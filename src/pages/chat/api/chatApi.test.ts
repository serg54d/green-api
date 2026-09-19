import {greenApiClient} from '@/shared/api/green-api/client';
import {chatApi} from './chatApi';

jest.mock('@/shared/api/green-api/client', () => ({
  greenApiClient: {
    post: jest.fn(),
  },
}));

const credentials = {
  idInstance: '123456',
  apiTokenInstance: 'token',
};

describe('chatApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('проверяет наличие аккаунта', async () => {
    jest.mocked(greenApiClient.post).mockResolvedValue({
      data: {
        exist: true,
        chatId: '6139795',
        fromCache: false,
      },
    });

    const result = await chatApi.checkAccount(credentials, '79991234567');

    expect(greenApiClient.post).toHaveBeenCalledWith(
      '/waInstance123456/checkAccount/token',
      {
        phoneNumber: 79991234567,
      },
      {
        signal: undefined,
      },
    );

    expect(result).toEqual({
      exist: true,
      chatId: '6139795',
      fromCache: false,
    });
  });

  it('передает AbortSignal', async () => {
    const controller = new AbortController();

    jest.mocked(greenApiClient.post).mockResolvedValue({
      data: {
        exist: true,
        chatId: '6139795',
        fromCache: false,
      },
    });

    await chatApi.checkAccount(credentials, '79991234567', controller.signal);

    expect(greenApiClient.post).toHaveBeenCalledWith(expect.any(String), expect.any(Object), {
      signal: controller.signal,
    });
  });
});
