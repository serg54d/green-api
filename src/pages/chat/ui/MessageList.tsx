import {Check} from 'lucide-react';
import type {ChatMessage} from '../model/types';
import styles from './MessageList.module.scss';

export function MessageList({messages}: {messages: ChatMessage[]}) {
  return (
    <div className={styles.messages} role="log" aria-label="Переписка">
      {messages.map((message) => (
        <div className={styles.messageBubble} key={message.id}>
          <span className={styles.messageText}>{message.text}</span>
          <span className={styles.messageTime}>{message.time}</span>
          <Check size={15} strokeWidth={2.3} />
        </div>
      ))}
    </div>
  );
}
