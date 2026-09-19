'use client';

import {createContext, type ReactNode, useState, useEffect} from 'react';

import {AuthStore} from './model/AuthStore';

export const AuthContext = createContext<AuthStore | null>(null);

type Props = {
  children: ReactNode;
};

export function AuthProvider({children}: Props) {
  const [authStore] = useState(() => new AuthStore());

  useEffect(() => {
    return () => authStore.logout();
  }, [authStore]);

  return <AuthContext.Provider value={authStore}>{children}</AuthContext.Provider>;
}
