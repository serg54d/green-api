import {greenApiClient} from '@/shared/api/green-api/client';
import type {Credentials} from '@/shared/api/green-api/types';

export interface GetStateInstanceResponse {
  stateInstance: string;
}

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
