'use client';

import {Input} from 'antd';
import {SendHorizontal} from 'lucide-react';

import styles from './MessageComposer.module.scss';

type Props = {
  value: string;
  isSending: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
};

export function MessageComposer({value, isSending, onChange, onSend}: Props) {
  const canSend = value.trim().length > 0 && value.length <= 4000 && !isSending;

  const handleSend = () => {
    if (!canSend) {
      return;
    }

    onSend();
  };

  return (
    <form
      className={styles.composer}
      onSubmit={(event) => {
        event.preventDefault();
        handleSend();
      }}
    >
      <Input.TextArea
        className={styles.textarea}
        aria-label="Сообщение"
        placeholder="Сообщение"
        value={value}
        maxLength={4000}
        autoSize={{
          minRows: 1,
          maxRows: 5,
        }}
        variant="borderless"
        onChange={(event) => onChange(event.target.value)}
        onPressEnter={(event) => {
          if (event.shiftKey) {
            return;
          }

          event.preventDefault();
          handleSend();
        }}
      />

      <button type="submit" aria-label="Отправить сообщение" disabled={!canSend}>
        <SendHorizontal size={22} />
      </button>
    </form>
  );
}
