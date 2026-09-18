import type {ChatPreview} from '../model/types';
import styles from './ChatHeader.module.scss';

export function ChatHeader({chat}: {chat: ChatPreview}) {
  return (
    <header className={styles.conversationHeader}>
      <span className={`${styles.avatar} ${styles[`avatar_${chat.tone}`]}`}>{chat.initials}</span>

      <div className={styles.contactInfo}>
        <strong>{chat.name}</strong>
        <span>Был(а) недавно</span>
      </div>
    </header>
  );
}
