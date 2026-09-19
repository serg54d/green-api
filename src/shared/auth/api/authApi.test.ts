import {greenApiClient} from '@/shared/api/green-api/client';
import {authApi} from './authApi';

jest.mock('@/shared/api/green-api/client', () => ({greenApiClient: {get: jest.fn()}}));
const get = jest.mocked(greenApiClient.get);

describe('authApi.getStateInstance', () => {
  beforeEach(() => {
    get.mockReset();
  });

  it('передаёт реквизиты в пути запроса и сигнал отмены', async () => {
    get.mockResolvedValue({data: {stateInstance: 'authorized'}});
    const controller = new AbortController();
    await expect(
      authApi.getStateInstance(
        {idInstance: '123', apiTokenInstance: 'test-token'},
        controller.signal,
      ),
    ).resolves.toEqual({stateInstance: 'authorized'});
    expect(get).toHaveBeenCalledWith('/waInstance123/getStateInstance/test-token', {
      signal: controller.signal,
    });
  });

  it('передаёт ошибку запроса вызывающему коду', async () => {
    const error = new Error('Request failed');
    get.mockRejectedValue(error);
    await expect(
      authApi.getStateInstance({idInstance: '123', apiTokenInstance: 'token'}),
    ).rejects.toBe(error);
  });
});
