'use client';

import {reaction} from 'mobx';
import {type ReactNode, useEffect, useState} from 'react';

import {useAuth} from '@/shared/auth';

import {ChatStore} from '@/pages/chat/store/ChatStore';
import {ChatContext} from '@/pages/chat/store/ChatContext';

type Props = {
  children: ReactNode;
};

export function ChatProvider({children}: Props) {
  const authStore = useAuth();

  const [chatStore] = useState(() => new ChatStore(() => authStore.credentials));

  useEffect(() => {
    const stopWatchingCredentials = reaction(
      () => authStore.credentials,
      (credentials) => {
        chatStore.reset();

        if (credentials) {
          chatStore.startPolling();
        }
      },
      {
        fireImmediately: true,
      },
    );

    return () => {
      stopWatchingCredentials();
      chatStore.reset();
    };
  }, [authStore, chatStore]);

  return <ChatContext.Provider value={chatStore}>{children}</ChatContext.Provider>;
}
