'use client';

import {Button, Input} from 'antd';
import {ArrowLeft, ChevronRight, ExternalLink, LogIn, LogOut} from 'lucide-react';
import {useState} from 'react';
import {observer} from 'mobx-react-lite';
import {useRouter} from 'next/navigation';
import {Controller, useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {useAuth} from '@/shared/auth';
import {connectionSchema, type ConnectionFormValues} from './model/connectionSchema';

import styles from './ConnectionPage.module.scss';

export const ConnectionPage = observer(() => {
  const authStore = useAuth();
  const router = useRouter();
  const [isMobileContentOpen, setIsMobileContentOpen] = useState(false);
  const {
    control,
    handleSubmit,
    reset,
    formState: {errors, isSubmitting},
  } = useForm<ConnectionFormValues>({
    resolver: yupResolver(connectionSchema),
    defaultValues: {idInstance: '', apiTokenInstance: ''},
  });
  const connecting = isSubmitting || authStore.status === 'connecting';
  const handleConnect = handleSubmit(async (values) => {
    if (await authStore.connect(values)) {
      reset();
      router.replace('/chat');
    }
  });
  const handleLogout = () => {
    authStore.logout();
    reset();
    router.replace('/connection');
  };

  const {isAuthorized} = authStore;
  const needsInstanceAuthorization = authStore.instanceState === 'notAuthorized';

  return (
    <section className={`${styles.root} ${isMobileContentOpen ? styles.mobileContentOpen : ''}`}>
      <aside className={styles.settings}>
        <h1>Настройки</h1>

        <button
          className={styles.settingsItem}
          type="button"
          onClick={() => setIsMobileContentOpen(true)}
        >
          {isAuthorized ? <LogOut size={24} /> : <LogIn size={24} />}

          <span>{isAuthorized ? 'Выход' : 'Вход'}</span>

          <ChevronRight className={styles.chevron} size={24} />
        </button>
      </aside>

      <main className={styles.content}>
        <header className={styles.header}>
          <button
            className={styles.backButton}
            type="button"
            aria-label="Назад к настройкам"
            title="Назад к настройкам"
            onClick={() => setIsMobileContentOpen(false)}
          >
            <ArrowLeft size={24} />
          </button>
          <h2>{isAuthorized ? 'Выход' : 'Вход'}</h2>
        </header>

        {isAuthorized ? (
          <div className={styles.authorizedState}>
            <LogOut size={42} />

            <h2>Вы авторизованы</h2>

            <p>Чтобы подключить другой аккаунт, сначала выйдите из текущего.</p>

            <Button className={styles.logoutButton} size="large" danger onClick={handleLogout}>
              Выйти
            </Button>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleConnect} noValidate aria-busy={connecting}>
            <div>
              <Controller
                name="idInstance"
                control={control}
                render={({field}) => (
                  <Input
                    {...field}
                    aria-label="idInstance"
                    placeholder="idInstance"
                    size="large"
                    inputMode="numeric"
                    disabled={connecting}
                    status={errors.idInstance ? 'error' : undefined}
                    aria-invalid={Boolean(errors.idInstance)}
                    aria-describedby={errors.idInstance ? 'instance-error' : undefined}
                  />
                )}
              />
              {errors.idInstance && (
                <p id="instance-error" role="alert" className={styles.error}>
                  {errors.idInstance.message}
                </p>
              )}
            </div>

            <div>
              <Controller
                name="apiTokenInstance"
                control={control}
                render={({field}) => (
                  <Input.Password
                    {...field}
                    aria-label="apiTokenInstance"
                    placeholder="apiTokenInstance"
                    size="large"
                    autoComplete="off"
                    disabled={connecting}
                    status={errors.apiTokenInstance ? 'error' : undefined}
                    aria-invalid={Boolean(errors.apiTokenInstance)}
                    aria-describedby={errors.apiTokenInstance ? 'token-error' : undefined}
                  />
                )}
              />
              {errors.apiTokenInstance && (
                <p id="token-error" role="alert" className={styles.error}>
                  {errors.apiTokenInstance.message}
                </p>
              )}
            </div>
            {needsInstanceAuthorization ? (
              <div className={styles.connectionNotice} role="status">
                <p>{authStore.error}</p>
                <a
                  href="https://console.green-api.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.consoleLink}
                >
                  Открыть GREEN-API
                  <ExternalLink size={16} aria-hidden="true" />
                </a>
              </div>
            ) : (
              authStore.error && (
                <p role="alert" className={styles.error}>
                  {authStore.error}
                </p>
              )
            )}

            <Button
              className={styles.loginButton}
              htmlType="submit"
              size="large"
              type="primary"
              loading={connecting}
              disabled={connecting}
            >
              Войти
            </Button>
          </form>
        )}
      </main>
    </section>
  );
});
