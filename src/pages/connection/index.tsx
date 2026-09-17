'use client';

import {Button, Input} from 'antd';
import {ChevronRight, LogIn, LogOut} from 'lucide-react';

import styles from './ConnectionPage.module.scss';

const IS_AUTHORIZED = true;

export function ConnectionPage() {
  return (
      <section className={styles.root}>
        <aside className={styles.settings}>
          <h1>Настройки</h1>

          <button
              className={styles.settingsItem}
              type="button"
          >
            {IS_AUTHORIZED ? (
                <LogOut size={24} />
            ) : (
                <LogIn size={24} />
            )}

            <span>{IS_AUTHORIZED ? 'Выход' : 'Вход'}</span>

            <ChevronRight
                className={styles.chevron}
                size={24}
            />
          </button>
        </aside>

        <main className={styles.content}>
          <header className={styles.header}>
            <h2>{IS_AUTHORIZED ? 'Выход' : 'Вход'}</h2>
          </header>

          {IS_AUTHORIZED ? (
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
                >
                  Выйти
                </Button>
              </div>
          ) : (
              <form
                  className={styles.form}
                  onSubmit={(event) => event.preventDefault()}
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
}