'use client';

import {SendHorizontal} from 'lucide-react';

import styles from './MessageComposer.module.scss';

type Props = {
    disabled?: boolean;
};

export function MessageComposer({disabled = false}: Props) {
    return (
        <form
            className={styles.composer}
            onSubmit={(event) => event.preventDefault()}
        >
            <input
                aria-label="Сообщение"
                placeholder="Сообщение"
                disabled={disabled}
            />

            <button
                type="submit"
                aria-label="Отправить сообщение"
                disabled={disabled}
            >
                <SendHorizontal size={22} />
            </button>
        </form>
    );
}