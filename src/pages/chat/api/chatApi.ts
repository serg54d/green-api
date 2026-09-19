import {greenApiClient} from '@/shared/api/green-api/client';
import type {Credentials} from '@/shared/api/green-api/types';

export type CheckAccountResponse =
  {exist: boolean; chatId: string; fromCache: boolean} | {status: false; reason: string};

export const chatApi = {
  async checkAccount(
    {idInstance, apiTokenInstance}: Credentials,
    phoneNumber: string,
    signal?: AbortSignal,
  ): Promise<CheckAccountResponse> {
    const {data} = await greenApiClient.post<CheckAccountResponse>(
      `/waInstance${idInstance}/checkAccount/${apiTokenInstance}`,
      {
        phoneNumber: Number(phoneNumber),
      },
      {
        signal,
      },
    );

    return data;
  },
};
