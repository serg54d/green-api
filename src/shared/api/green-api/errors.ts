import axios from 'axios';

export function getConnectionErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      return 'Не удалось подтвердить доступ. Проверьте idInstance и apiTokenInstance.';
    }
    if (error.response?.status === 429) {
      return 'Слишком много запросов. Попробуйте подключиться позже.';
    }
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return 'Сервер не ответил вовремя. Попробуйте ещё раз.';
    }
    if (!error.response) {
      return 'Не удалось связаться с GREEN-API. Проверьте сеть и доступность API.';
    }
    return 'GREEN-API вернул ошибку. Проверьте данные подключения или попробуйте позже.';
  }
  return 'Не удалось проверить подключение. Попробуйте ещё раз.';
}

export function getInstanceStateMessage(state: string): string {
  switch (state) {
    case 'notAuthorized':
      return 'Инстанс не авторизован. Подключите MAX в личном кабинете GREEN-API, затем повторите проверку.';
    case 'starting':
      return 'Инстанс запускается. Попробуйте подключиться немного позже.';
    case 'blocked':
      return 'Аккаунт MAX заблокирован.';
    default:
      return 'Инстанс пока недоступен для подключения. Проверьте его состояние в GREEN-API.';
  }
}
