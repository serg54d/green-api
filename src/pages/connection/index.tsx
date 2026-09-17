'use client';

import {Button, Input} from 'antd';
import {ChevronRight, LogIn, LogOut} from 'lucide-react';
import {observer} from 'mobx-react-lite';
import {useAuth} from '@/shared/auth';

import styles from './ConnectionPage.module.scss';

export const ConnectionPage = observer(() => {
    const authStore = useAuth();

    const {isAuthorized} = authStore;

    return (
      <section className={styles.root}>
        <aside className={styles.settings}>
          <h1>Настройки</h1>

          <button
              className={styles.settingsItem}
              type="button"
          >
            {isAuthorized ? (
                <LogOut size={24} />
            ) : (
                <LogIn size={24} />
            )}

            <span>{isAuthorized ? 'Выход' : 'Вход'}</span>

            <ChevronRight
                className={styles.chevron}
                size={24}
            />
          </button>
        </aside>

        <main className={styles.content}>
          <header className={styles.header}>
            <h2>{isAuthorized ? 'Выход' : 'Вход'}</h2>
          </header>

          {isAuthorized ? (
              <div className={styles.authorizedState}>
                <LogOut size={42} />

                <h2>Вы авторизованы</h2>

                <p>
                  Чтобы подключить другой аккаунт, сначала выйдите из
                  текущего.
                </p>

                <Button
                    className={styles.logoutButton}
                    size="large"
                    danger
                    onClick={() => authStore.logout()}
                >
                  Выйти
                </Button>
              </div>
          ) : (
              <form
                  className={styles.form}
                  onSubmit={(event) => {
                      event.preventDefault();
                      authStore.login();
                  }}
              >
                <Input
                    name="idInstance"
                    placeholder="idInstance"
                    size="large"
                />

                <Input.Password
                    name="apiTokenInstance"
                    placeholder="apiTokenInstance"
                    size="large"
                />

                <Button
                    className={styles.loginButton}
                    htmlType="submit"
                    size="large"
                    type="primary"
                >
                  Войти
                </Button>
              </form>
          )}
        </main>
      </section>
  );
})