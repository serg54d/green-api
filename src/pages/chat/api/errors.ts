import axios from 'axios';

export type SendMessageFailure = {
  status: 'error' | 'unknown';
  message: string;
};

export function getSendMessageFailure(error: unknown): SendMessageFailure {
  if (
    !axios.isAxiosError(error) ||
    !error.response ||
    error.response.status >= 500 ||
    error.response.status === 408
  ) {
    return {
      status: 'unknown',
      message: 'Не удалось подтвердить отправку',
    };
  }

  switch (error.response.status) {
    case 400:
      return {
        status: 'error',
        message: 'GREEN-API отклонил сообщение',
      };

    case 403:
      return {
        status: 'error',
        message: 'Отправка сообщений недоступна для аккаунта',
      };

    case 429:
      return {
        status: 'error',
        message: 'Слишком много запросов. Попробуйте позже',
      };

    default:
      return {
        status: 'error',
        message: 'GREEN-API не принял сообщение',
      };
  }
}
