import {makeAutoObservable, runInAction} from 'mobx';

import type {NotificationBody, OutgoingMessageStatus} from '../api/chatApi';

import {chatApi} from '../api/chatApi';
import type {Credentials} from '@shared/api/green-api/types';
import {getSendMessageFailure, isConnectionAccessError} from '../api/errors';

import {normalizePhoneNumber} from '@/shared/lib/phone';
import {isSupportedPhoneNumber} from '../model/phone';
import type {Chat} from '../model/types';

type GetCredentials = () => Credentials | null;

export class ChatStore {
  chats: Chat[] = [];
  activeChatId: string | null = null;
  isCreating = false;
  error: string | null = null;
  notificationSettingsWarning: string | null = null;
  notificationWarning: string | null = null;
  pollingError: string | null = null;
  drafts = new Map<string, string>();
  sendingChatIds = new Set<string>();

  private pollingController: AbortController | null = null;

  private sendControllers = new Map<string, AbortController>();
  private messageSequence = 0;
  private pendingStatuses = new Map<
    string,
    {status: OutgoingMessageStatus; description?: string}[]
  >();

  private controller: AbortController | null = null;
  private readonly getCredentials: GetCredentials;

  constructor(getCredentials: GetCredentials) {
    this.getCredentials = getCredentials;

    makeAutoObservable<
      this,
      | 'controller'
      | 'getCredentials'
      | 'sendControllers'
      | 'messageSequence'
      | 'pollingController'
      | 'pendingStatuses'
    >(this, {
      controller: false,
      getCredentials: false,
      sendControllers: false,
      messageSequence: false,
      pollingController: false,
      pendingStatuses: false,
    });
  }

  getDraft(chatId: string): string {
    return this.drafts.get(chatId) ?? '';
  }

  setDraft(chatId: string, value: string) {
    this.drafts.set(chatId, value);
  }

  isChatSending(chatId: string): boolean {
    return this.sendingChatIds.has(chatId);
  }

  startPolling() {
    if (this.pollingController) {
      return;
    }

    const credentials = this.getCredentials();

    if (!credentials) {
      return;
    }

    const controller = new AbortController();

    this.pollingController = controller;

    void this.watchNotificationSettings(credentials, controller);

    void this.pollNotifications(credentials, controller);
  }

  clearNotificationWarning() {
    this.notificationWarning = null;
  }

  stopPolling() {
    this.pollingController?.abort();
    this.pollingController = null;
  }

  private stopPollingOnAccessError() {
    this.stopPolling();
    this.notificationSettingsWarning = null;
    this.pollingError =
      'GREEN-API отклонил доступ. Обновления остановлены. Проверьте ID инстанса, токен и адрес API, затем выйдите и подключитесь заново.';
  }

  private waitForRetry(milliseconds: number, signal: AbortSignal): Promise<void> {
    return new Promise((resolve) => {
      if (signal.aborted) {
        resolve();
        return;
      }
      const finish = () => {
        clearTimeout(timer);
        signal.removeEventListener('abort', finish);
        resolve();
      };
      const timer = setTimeout(finish, milliseconds);
      signal.addEventListener('abort', finish, {once: true});
    });
  }

  get activeChat(): Chat | null {
    if (!this.activeChatId) {
      return null;
    }

    return this.chats.find((chat) => chat.id === this.activeChatId) ?? null;
  }

  selectChat(chatId: string) {
    if (!this.chats.some((chat) => chat.id === chatId)) {
      return;
    }

    this.activeChatId = chatId;
  }

  async createChat(value: string): Promise<boolean> {
    if (this.isCreating) {
      return false;
    }

    const phoneNumber = normalizePhoneNumber(value);

    if (!phoneNumber || !isSupportedPhoneNumber(phoneNumber)) {
      this.error = 'Введите корректный номер телефона';
      return false;
    }

    const existingByPhone = this.chats.find((chat) => chat.phoneNumber === phoneNumber);

    if (existingByPhone) {
      this.activeChatId = existingByPhone.id;
      this.error = null;

      return true;
    }

    const credentials = this.getCredentials();

    if (!credentials) {
      this.error = 'Нет активного подключения к GREEN-API';
      return false;
    }

    const controller = new AbortController();

    this.controller = controller;
    this.isCreating = true;
    this.error = null;

    try {
      const result = await chatApi.checkAccount(credentials, phoneNumber, controller.signal);

      if (this.controller !== controller || controller.signal.aborted) {
        return false;
      }

      if ('status' in result && result.status === false) {
        runInAction(() => {
          this.error = result.reason || 'GREEN-API не удалось проверить аккаунт';
        });

        return false;
      }

      if (!('exist' in result) || !result.exist || !result.chatId) {
        runInAction(() => {
          this.error = 'Аккаунт MAX для этого номера не найден';
        });

        return false;
      }

      runInAction(() => {
        const existingByChatId = this.chats.find((chat) => chat.id === result.chatId);

        if (existingByChatId) {
          this.activeChatId = existingByChatId.id;
          return;
        }

        this.chats.push({
          id: result.chatId,
          phoneNumber,
          messages: [],
        });

        this.activeChatId = result.chatId;
      });

      return true;
    } catch {
      if (this.controller !== controller || controller.signal.aborted) {
        return false;
      }

      runInAction(() => {
        this.error = 'Не удалось проверить номер через GREEN-API. Попробуйте ещё раз.';
      });

      return false;
    } finally {
      if (this.controller === controller) {
        runInAction(() => {
          this.controller = null;
          this.isCreating = false;
        });
      }
    }
  }

  async sendMessage(chatId: string, text: string): Promise<boolean> {
    if (this.sendingChatIds.has(chatId)) {
      return false;
    }

    if (!text.trim() || text.length > 4000) {
      return false;
    }

    const credentials = this.getCredentials();

    if (!credentials) {
      return false;
    }

    const chat = this.chats.find((item) => item.id === chatId);

    if (!chat) {
      return false;
    }

    const controller = new AbortController();

    const localMessageId = `local-${Date.now()}-${this.messageSequence++}`;

    chat.messages.push({
      id: localMessageId,
      text,
      time: new Date().toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      direction: 'outgoing',
      status: 'sending',
    });

    this.drafts.set(chatId, '');
    this.sendControllers.set(chatId, controller);
    this.sendingChatIds.add(chatId);

    try {
      const result = await chatApi.sendMessage(credentials, chatId, text, controller.signal);

      if (this.sendControllers.get(chatId) !== controller || controller.signal.aborted) {
        return false;
      }

      runInAction(() => {
        const currentChat = this.chats.find((item) => item.id === chatId);

        const message = currentChat?.messages.find((item) => item.id === localMessageId);

        if (!message) {
          return;
        }

        message.idMessage = result.idMessage;
        message.status = 'queued';
        message.error = undefined;
        // Статус может прийти раньше ответа sendMessage с idMessage.
        const statuses = this.pendingStatuses.get(result.idMessage) ?? [];
        this.pendingStatuses.delete(result.idMessage);
        for (const pending of statuses) {
          this.updateMessageStatus(result.idMessage, pending.status, pending.description);
        }
      });

      return true;
    } catch (error) {
      if (this.sendControllers.get(chatId) !== controller || controller.signal.aborted) {
        return false;
      }

      const failure = getSendMessageFailure(error);

      runInAction(() => {
        const currentChat = this.chats.find((item) => item.id === chatId);

        const message = currentChat?.messages.find((item) => item.id === localMessageId);

        if (!message) {
          return;
        }

        message.status = failure.status;
        message.error = failure.message;
      });

      return false;
    } finally {
      if (this.sendControllers.get(chatId) === controller) {
        runInAction(() => {
          this.sendControllers.delete(chatId);
          this.sendingChatIds.delete(chatId);
          if (this.sendControllers.size === 0) this.pendingStatuses.clear();
        });
      }
    }
  }

  private async pollNotifications(credentials: Credentials, controller: AbortController) {
    let failedAttempts = 0;
    while (this.pollingController === controller && !controller.signal.aborted) {
      try {
        const notification = await chatApi.receiveNotification(credentials, controller.signal);

        if (this.pollingController !== controller || controller.signal.aborted) {
          return;
        }

        if (!notification) {
          failedAttempts = 0;
          runInAction(() => {
            this.pollingError = null;
          });
          continue;
        }

        this.handleNotification(notification.body);

        const deletion = await chatApi.deleteNotification(
          credentials,
          notification.receiptId,
          controller.signal,
        );
        if (this.pollingController !== controller || controller.signal.aborted) return;
        if (!deletion.result) throw new Error('NOTIFICATION_NOT_DELETED');
        failedAttempts = 0;
        runInAction(() => {
          this.pollingError = null;
        });
      } catch (error) {
        if (this.pollingController !== controller || controller.signal.aborted) {
          return;
        }

        if (isConnectionAccessError(error)) {
          this.stopPollingOnAccessError();
          return;
        }

        failedAttempts += 1;

        if (failedAttempts >= 3) {
          runInAction(() => {
            this.pollingError =
              'Не удалось получать обновления от GREEN-API. Повторяем подключение автоматически.';
          });
        }

        await this.waitForRetry(1500, controller.signal);
      }
    }
  }

  private async checkNotificationSettings(
    credentials: Credentials,
    controller: AbortController,
  ): Promise<boolean> {
    try {
      const settings = await chatApi.getSettings(credentials, controller.signal);

      if (this.pollingController !== controller || controller.signal.aborted) {
        return false;
      }

      const issues: string[] = [];

      if (settings.webhookUrl) {
        issues.push('очистите «Адрес отправки уведомлений (URL)»');
      }

      if (settings.incomingWebhook !== 'yes') {
        issues.push('включите уведомления о входящих сообщениях');
      }

      if (settings.outgoingMessageWebhook !== 'yes') {
        issues.push('включите уведомления о сообщениях, отправленных с телефона');
      }

      if (settings.outgoingAPIMessageWebhook !== 'yes') {
        issues.push('включите уведомления о сообщениях, отправленных с API');
      }

      if (settings.outgoingWebhook !== 'yes') {
        issues.push('включите уведомления о статусах отправленных сообщений');
      }

      runInAction(() => {
        this.notificationSettingsWarning = issues.length
          ? `Проверьте настройки инстанса GREEN-API: ${issues.join('; ')}.`
          : null;
      });

      return issues.length === 0;
    } catch (error) {
      if (this.pollingController !== controller || controller.signal.aborted) {
        return false;
      }

      if (isConnectionAccessError(error)) {
        this.stopPollingOnAccessError();
        return false;
      }

      runInAction(() => {
        this.notificationSettingsWarning = 'Не удалось проверить настройки уведомлений GREEN-API.';
      });

      return false;
    }
  }

  private async watchNotificationSettings(credentials: Credentials, controller: AbortController) {
    while (this.pollingController === controller && !controller.signal.aborted) {
      const isValid = await this.checkNotificationSettings(credentials, controller);

      if (isValid || this.pollingController !== controller || controller.signal.aborted) {
        return;
      }

      await this.waitForRetry(15000, controller.signal);
    }
  }

  private handleNotification(body: NotificationBody) {
    if (body.typeWebhook === 'incomingMessageReceived') {
      this.addIncomingMessage(body);
      return;
    }
    if (body.typeWebhook !== 'outgoingMessageStatus' || !body.idMessage || !body.status) {
      return;
    }

    this.updateMessageStatus(body.idMessage, body.status, body.description);
  }

  private addIncomingMessage(body: NotificationBody) {
    const chatId = body.senderData?.chatId;
    const data = body.messageData;
    const text =
      data?.typeMessage === 'textMessage'
        ? data.textMessageData?.textMessage
        : data?.typeMessage === 'extendedTextMessage'
          ? data.extendedTextMessageData?.text
          : 'Сообщение этого типа не поддерживается';
    if (
      typeof chatId !== 'string' ||
      !chatId ||
      typeof body.idMessage !== 'string' ||
      !body.idMessage ||
      typeof data?.typeMessage !== 'string' ||
      !data.typeMessage ||
      typeof text !== 'string'
    ) {
      // Повторный запрос не исправит данные: предупреждаем и даём подтвердить событие.
      this.notificationWarning =
        'Получено некорректное уведомление GREEN-API. Одно из сообщений не удалось отобразить. Проверьте переписку в MAX.';
      return;
    }

    let chat = this.chats.find((item) => item.id === chatId);
    if (!chat) {
      this.chats.push({
        id: chatId,
        phoneNumber: body.senderData?.senderPhoneNumber
          ? String(body.senderData.senderPhoneNumber)
          : '',
        title: body.senderData?.chatName || `Чат ${chatId}`,
        messages: [],
      });
      chat = this.chats[this.chats.length - 1];
    }
    // При ошибке подтверждения очередь может повторно выдать то же сообщение.
    if (chat.messages.some((message) => message.idMessage === body.idMessage)) return;
    chat.messages.push({
      id: body.idMessage,
      idMessage: body.idMessage,
      text,
      time: new Date(body.timestamp ? body.timestamp * 1000 : Date.now()).toLocaleTimeString(
        'ru-RU',
        {hour: '2-digit', minute: '2-digit'},
      ),
      direction: 'incoming',
    });
  }

  private updateMessageStatus(
    idMessage: string,
    status: OutgoingMessageStatus,
    description?: string,
  ) {
    const message = this.chats
      .flatMap((chat) => chat.messages)
      .find((item) => item.idMessage === idMessage);

    if (!message) {
      if (this.sendControllers.size > 0) {
        const statuses = this.pendingStatuses.get(idMessage) ?? [];
        statuses.push({status, description});
        this.pendingStatuses.set(idMessage, statuses);
      }
      return;
    }

    switch (status) {
      case 'delivered':
        if (message.status !== 'read') {
          message.status = 'delivered';
        }

        message.error = undefined;
        break;

      case 'read':
        message.status = 'read';
        message.error = undefined;
        break;

      case 'failed':
        message.status = 'error';
        message.error = description || 'Ошибка отправки сообщения';
        break;

      case 'noAccount':
        message.status = 'error';
        message.error = description || 'Аккаунт MAX не найден';
        break;

      case 'notInGroup':
        message.status = 'error';
        message.error = description || 'Нет доступа к указанному чату';
        break;
    }
  }

  cancelCreateChat() {
    this.controller?.abort();
    this.controller = null;
    this.isCreating = false;
    this.error = null;
  }

  clearError() {
    this.error = null;
  }

  reset() {
    this.stopPolling();

    this.controller?.abort();
    this.controller = null;

    this.sendControllers.forEach((controller) => {
      controller.abort();
    });

    this.notificationSettingsWarning = null;
    this.notificationWarning = null;
    this.pollingError = null;
    this.sendControllers.clear();
    this.pendingStatuses.clear();
    this.sendingChatIds.clear();
    this.drafts.clear();

    this.chats = [];
    this.activeChatId = null;
    this.isCreating = false;
    this.error = null;
  }
}
