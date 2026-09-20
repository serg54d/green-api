import {observer} from 'mobx-react-lite';

import type {ChatMessage, MessageStatus} from '../model/types';

import styles from './MessageList.module.scss';

const statusLabels: Record<MessageStatus, string> = {
  sending: 'Отправляется',
  queued: 'Принято в очередь',
  delivered: 'Доставлено',
  read: 'Прочитано',
  error: 'Ошибка отправки',
  unknown: 'Не удалось подтвердить отправку',
};

export const MessageList = observer(({messages}: {messages: ChatMessage[]}) => {
  return (
    <div className={styles.messages} role="log" aria-label="Переписка">
      {messages.length === 0 ? (
        <div className={styles.empty}>Нет сообщений</div>
      ) : (
        messages.map((message) => (
          <div
            className={`${styles.messageBubble} ${
              message.direction === 'incoming' ? styles.incoming : styles.outgoing
            }`}
            key={message.id}
          >
            <span className={styles.messageText}>{message.text}</span>

            <div className={styles.messageMeta}>
              <span className={styles.messageTime}>{message.time}</span>

              {message.direction === 'outgoing' && message.status && (
                <span
                  className={`${styles.status} ${styles[`status_${message.status}`]}`}
                  title={message.error}
                >
                  {message.error ?? statusLabels[message.status]}
                </span>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
});
