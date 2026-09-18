'use client';
import {SendHorizontal} from 'lucide-react';
import styles from './MessageComposer.module.scss';

export function MessageComposer() {
  return (
    <form className={styles.composer} onSubmit={(event) => event.preventDefault()}>
      <input aria-label="Сообщение" placeholder="Сообщение" />

      <button type="submit" aria-label="Отправить сообщение">
        <SendHorizontal size={22} />
      </button>
    </form>
  );
}
