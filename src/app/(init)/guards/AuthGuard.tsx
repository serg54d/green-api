'use client';

import type {ReactNode} from 'react';
import Link from 'next/link';
import {LogIn} from 'lucide-react';
import {observer} from 'mobx-react-lite';

import {useAuth} from '@/shared/auth';

import styles from './AuthGuard.module.scss';

type Props = {
    children: ReactNode;
};

const AuthGuard = observer(({children}: Props) => {
    const authStore = useAuth();

    if (authStore.isAuthorized) {
        return <>{children}</>;
    }

    return (
        <div className={styles.root}>
            <div className={styles.icon}>
                <LogIn size={36} />
            </div>

            <h2>Вы не авторизованы</h2>

            <p>
                Войдите в GREEN-API, чтобы начать работу с чатами
            </p>

            <Link
                className={styles.button}
                href="/connection"
            >
                Войти
            </Link>
        </div>
    );
});

export default AuthGuard;