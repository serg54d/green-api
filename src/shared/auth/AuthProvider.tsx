'use client';

import {
    createContext,
    type ReactNode,
    useRef,
} from 'react';

import {AuthStore} from './model/AuthStore';

export const AuthContext = createContext<AuthStore | null>(null);

type Props = {
    children: ReactNode;
};

export function AuthProvider({children}: Props) {
    const authStoreRef = useRef<AuthStore | null>(null);

    if (!authStoreRef.current) {
        authStoreRef.current = new AuthStore();
    }

    return (
        <AuthContext.Provider value={authStoreRef.current}>
            {children}
        </AuthContext.Provider>
    );
}