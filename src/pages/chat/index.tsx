'use client';

import Link from 'next/link';
import {Check, LogIn, Plus, SendHorizontal} from 'lucide-react';

import styles from './ChatPage.module.scss';

const IS_AUTHORIZED = true;

type ChatPreview = {
  id: number;
  name: string;
  message: string;
  time: string;
  initials: string;
  tone: 'coral' | 'blue';
};

const chats: ChatPreview[] = [
  {
    id: 1,
    name: 'Сергей Дунаев',
    message: 'Привет',
    time: '20:55',
    initials: 'СД',
    tone: 'coral',
  },
  {
    id: 2,
    name: 'Иван Иванов',
    message: 'Как дела?',
    time: '19:42',
    initials: 'ИИ',
    tone: 'blue',
  },
];

export function ChatPage() {
  if (!IS_AUTHORIZED) {
    return (
        <section className={styles.unauthorized}>
          <header className={styles.unauthorizedHeader}>
            <h1>Чаты</h1>
          </header>

          <div className={styles.unauthorizedContent}>
            <div className={styles.unauthorizedIcon}>
              <LogIn size={36} />
            </div>

            <h2>Вы не авторизованы</h2>

            <p>
              Войдите в аккаунт GREEN-API, чтобы начать работу с чатами
            </p>

            <Link
                className={styles.loginButton}
                href="/connection"
            >
              Войти
            </Link>
          </div>
        </section>
    );
  }

  return (
      <section className={styles.root}>
        <aside className={styles.chatList}>
          <header className={styles.chatListHeader}>
            <h1>Чаты</h1>

            <button
                className={styles.addChatButton}
                type="button"
                aria-label="Новый чат"
            >
              <Plus size={27} />
            </button>
          </header>

          <div className={styles.chats}>
            {chats.map((chat, index) => (
                <button
                    className={`${styles.chatPreview} ${
                        index === 0 ? styles.chatPreviewActive : ''
                    }`}
                    key={chat.id}
                    type="button"
                >
							<span
                                className={`${styles.avatar} ${
                                    styles[`avatar_${chat.tone}`]
                                }`}
                            >
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

								<span className={styles.chatMessage}>
									{chat.message}
								</span>
							</span>
                </button>
            ))}
          </div>
        </aside>

        <main className={styles.conversation}>
          <header className={styles.conversationHeader}>
					<span className={`${styles.avatar} ${styles.avatar_coral}`}>
						СД
					</span>

            <div className={styles.contactInfo}>
              <strong>Сергей Дунаев</strong>
              <span>Был(а) недавно</span>
            </div>
          </header>

          <div className={styles.messages}>
            <div className={styles.messageBubble}>
              <span>Привет</span>

              <span className={styles.messageTime}>20:55</span>

              <Check size={15} strokeWidth={2.3} />
            </div>

            <form className={styles.composer}>
              <input
                  aria-label="Сообщение"
                  placeholder="Сообщение"
              />

              <button
                  type="submit"
                  aria-label="Отправить сообщение"
              >
                <SendHorizontal size={22} />
              </button>
            </form>
          </div>
        </main>
      </section>
  );
}