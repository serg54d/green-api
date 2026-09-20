import {greenApiClient} from '@/shared/api/green-api/client';
import type {Credentials} from '@/shared/api/green-api/types';

export type CheckAccountResponse =
  {exist: boolean; chatId: string; fromCache: boolean} | {status: false; reason: string};

export type SendMessageResponse = {
  idMessage: string;
};

export type GetSettingsResponse = {
  webhookUrl: string;
  outgoingWebhook: 'yes' | 'no';
  outgoingMessageWebhook: 'yes' | 'no';
  outgoingAPIMessageWebhook: 'yes' | 'no';
  incomingWebhook: 'yes' | 'no';
};

export type OutgoingMessageStatus = 'delivered' | 'read' | 'failed' | 'noAccount' | 'notInGroup';

export type NotificationBody = {
  typeWebhook: string;
  chatId?: string;
  idMessage?: string;
  status?: OutgoingMessageStatus;
  description?: string;
  timestamp?: number;
  senderData?: {
    chatId: string;
    chatName?: string;
    senderPhoneNumber?: number;
  };
  messageData?: {
    typeMessage: string;
    textMessageData?: {textMessage: string};
    extendedTextMessageData?: {text: string};
  };
};

export type ReceiveNotificationResponse = {
  receiptId: number;
  body: NotificationBody;
};

export type DeleteNotificationResponse = {
  result: boolean;
  reason: string;
};

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

  async sendMessage(
    {idInstance, apiTokenInstance}: Credentials,
    chatId: string,
    message: string,
    signal?: AbortSignal,
  ): Promise<SendMessageResponse> {
    const {data} = await greenApiClient.post<SendMessageResponse>(
      `/waInstance${idInstance}/sendMessage/${apiTokenInstance}`,
      {
        chatId,
        message,
      },
      {
        signal,
      },
    );

    return data;
  },
  async receiveNotification(
    {idInstance, apiTokenInstance}: Credentials,
    signal?: AbortSignal,
  ): Promise<ReceiveNotificationResponse | null> {
    const {data} = await greenApiClient.get<ReceiveNotificationResponse | null>(
      `/waInstance${idInstance}/receiveNotification/${apiTokenInstance}`,
      {
        params: {
          receiveTimeout: 5,
        },
        signal,
      },
    );

    return data;
  },

  async deleteNotification(
    {idInstance, apiTokenInstance}: Credentials,
    receiptId: number,
    signal?: AbortSignal,
  ): Promise<DeleteNotificationResponse> {
    const {data} = await greenApiClient.delete<DeleteNotificationResponse>(
      `/waInstance${idInstance}/deleteNotification/${apiTokenInstance}/${receiptId}`,
      {
        signal,
      },
    );

    return data;
  },

  async getSettings(
    {idInstance, apiTokenInstance}: Credentials,
    signal?: AbortSignal,
  ): Promise<GetSettingsResponse> {
    const {data} = await greenApiClient.get<GetSettingsResponse>(
      `/waInstance${idInstance}/getSettings/${apiTokenInstance}`,
      {
        signal,
      },
    );

    return data;
  },
};
