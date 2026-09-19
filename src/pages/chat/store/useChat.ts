'use client';

import {useContext} from 'react';

import {ChatContext} from './ChatContext';

export function useChat() {
    const chatStore = useContext(ChatContext);

    if (!chatStore) {
        throw new Error('useChat must be used inside ChatProvider');
    }

    return chatStore;
}
