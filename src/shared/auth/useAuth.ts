'use client';

import {useContext} from 'react';

import {AuthContext} from './AuthProvider';

export function useAuth() {
    const authStore = useContext(AuthContext);

    if (!authStore) {
        throw new Error('useAuth must be used inside AuthProvider');
    }

    return authStore;
}
