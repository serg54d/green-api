import {greenApiClient} from './client';
import {authApi} from './authApi';

jest.mock('./client', () => ({greenApiClient: {get: jest.fn()}}));
const get = jest.mocked(greenApiClient.get);

describe('authApi.getStateInstance', () => {
  beforeEach(() => {
    get.mockReset();
  });

  it('sends credentials in the path and passes the abort signal', async () => {
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

  it('passes request errors to the caller', async () => {
    const error = new Error('Request failed');
    get.mockRejectedValue(error);
    await expect(
      authApi.getStateInstance({idInstance: '123', apiTokenInstance: 'token'}),
    ).rejects.toBe(error);
  });
});
