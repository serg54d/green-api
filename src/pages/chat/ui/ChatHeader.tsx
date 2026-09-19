import {ArrowLeft, UserRound} from 'lucide-react';

import {formatPhoneNumber} from '@/shared/lib/phone';
import type {Chat} from '../model/types';

import styles from './ChatHeader.module.scss';

type Props = {
    chat: Chat;
    onBack: () => void;
};

export function ChatHeader({chat, onBack}: Props) {
    return (
        <header className={styles.conversationHeader}>
            <button
                className={styles.backButton}
                type="button"
                aria-label="Назад к чатам"
                onClick={onBack}
            >
                <ArrowLeft size={24} />
            </button>

            <span className={styles.avatar}>
        <UserRound size={22} />
      </span>

            <strong>{formatPhoneNumber(chat.phoneNumber)}</strong>
        </header>
    );
}
