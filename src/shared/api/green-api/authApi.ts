import {greenApiClient} from './client';
import type {Credentials, GetStateInstanceResponse} from './types';

export const authApi = {
  async getStateInstance(
    {idInstance, apiTokenInstance}: Credentials,
    signal?: AbortSignal,
  ): Promise<GetStateInstanceResponse> {
    const {data} = await greenApiClient.get<GetStateInstanceResponse>(
      `/waInstance${idInstance}/getStateInstance/${apiTokenInstance}`,
      {signal},
    );

    return data;
  },
};
