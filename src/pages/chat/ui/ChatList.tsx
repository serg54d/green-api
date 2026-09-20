import {Plus, UserRound} from 'lucide-react';
import {observer} from 'mobx-react-lite';

import {formatPhoneNumber} from '@/shared/lib/phone';
import type {Chat} from '../model/types';

import styles from './ChatList.module.scss';

type Props = {
  chats: Chat[];
  activeChatId: string | null;
  onAdd: () => void;
  onSelect: (chatId: string) => void;
};

export const ChatList = observer(({chats, activeChatId, onAdd, onSelect}: Props) => {
  return (
    <aside className={styles.chatList}>
      <header className={styles.chatListHeader}>
        <h1>Чаты</h1>

        <button
          className={styles.addChatButton}
          type="button"
          aria-label="Новый чат"
          onClick={onAdd}
        >
          <Plus size={27} />
        </button>
      </header>

      {chats.length === 0 ? (
        <div className={styles.empty}>
          <span>Нет чатов</span>
          <p>Нажмите «+», чтобы добавить собеседника</p>
        </div>
      ) : (
        <div className={styles.chats}>
          {chats.map((chat) => {
            const lastMessage = chat.messages[chat.messages.length - 1];

            return (
              <button
                className={`${styles.chatPreview} ${
                  activeChatId === chat.id ? styles.chatPreviewActive : ''
                }`}
                key={chat.id}
                type="button"
                onClick={() => onSelect(chat.id)}
              >
                <span className={styles.avatar}>
                  <UserRound size={25} />
                </span>

                <span className={styles.chatPreviewContent}>
                  <strong>{chat.title || formatPhoneNumber(chat.phoneNumber)}</strong>

                  <span className={styles.chatMessage}>{lastMessage?.text ?? 'Нет сообщений'}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </aside>
  );
});
