'use client';

import {
    createContext,
    type ReactNode,
    useRef,
} from 'react';

import {AuthStore} from '@/shared/auth/model/AuthStore';

export const AuthContext = createContext<AuthStore | null>(null);

const AuthProvider = ({children}: {children: ReactNode}) => {
    const authStoreRef = useRef<AuthStore | null>(null);

    if (!authStoreRef.current) {
        authStoreRef.current = new AuthStore();
    }

    return (
        <AuthContext.Provider value={authStoreRef.current}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;