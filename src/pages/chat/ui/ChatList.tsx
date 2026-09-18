import {Check, Plus} from 'lucide-react';
import type {ChatPreview} from '../model/types';
import styles from './ChatList.module.scss';

export function ChatList({chats}: {chats: ChatPreview[]}) {
  return (
    <aside className={styles.chatList}>
      <header className={styles.chatListHeader}>
        <h1>Чаты</h1>

        <button className={styles.addChatButton} type="button" aria-label="Новый чат">
          <Plus size={27} />
        </button>
      </header>

      <div className={styles.chats}>
        {chats.map((chat, index) => (
          <button
            className={`${styles.chatPreview} ${index === 0 ? styles.chatPreviewActive : ''}`}
            key={chat.id}
            type="button"
          >
            <span className={`${styles.avatar} ${styles[`avatar_${chat.tone}`]}`}>
              {chat.initials}
            </span>

            <span className={styles.chatPreviewContent}>
              <span className={styles.chatPreviewRow}>
                <strong>{chat.name}</strong>

                <span className={styles.chatMeta}>
                  <Check size={17} strokeWidth={2.2} />
                  <time>{chat.time}</time>
                </span>
              </span>

              <span className={styles.chatMessage}>{chat.message}</span>
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
}
