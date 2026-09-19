import {makeAutoObservable, runInAction} from 'mobx';

import {chatApi} from '../api/chatApi';
import type {Credentials} from '@shared/api/green-api/types';

import {normalizePhoneNumber} from '@/shared/lib/phone';
import {isSupportedPhoneNumber} from '../model/phone';
import type {Chat} from '../model/types';

type GetCredentials = () => Credentials | null;

export class ChatStore {
    chats: Chat[] = [];
    activeChatId: string | null = null;
    isCreating = false;
    error: string | null = null;

    private controller: AbortController | null = null;
    private readonly getCredentials: GetCredentials;

    constructor(getCredentials: GetCredentials) {
        this.getCredentials = getCredentials;

        makeAutoObservable<this, 'controller' | 'getCredentials'>(this, {
            controller: false,
            getCredentials: false,
        });
    }

    get activeChat(): Chat | null {
        if (!this.activeChatId) {
            return null;
        }

        return (
            this.chats.find((chat) => chat.id === this.activeChatId) ??
            null
        );
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

        const existingByPhone = this.chats.find(
            (chat) => chat.phoneNumber === phoneNumber,
        );

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
            const result = await chatApi.checkAccount(
                credentials,
                phoneNumber,
                controller.signal,
            );

            if (
                this.controller !== controller ||
                controller.signal.aborted
            ) {
                return false;
            }

            if ('status' in result && result.status === false) {
                runInAction(() => {
                    this.error =
                        result.reason ||
                        'GREEN-API не удалось проверить аккаунт';
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
                const existingByChatId = this.chats.find(
                    (chat) => chat.id === result.chatId,
                );

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
            if (
                this.controller !== controller ||
                controller.signal.aborted
            ) {
                return false;
            }

            runInAction(() => {
                this.error =
                    'Не удалось проверить номер через GREEN-API. Попробуйте ещё раз.';
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
        this.controller?.abort();
        this.controller = null;

        this.chats = [];
        this.activeChatId = null;
        this.isCreating = false;
        this.error = null;
    }
}
