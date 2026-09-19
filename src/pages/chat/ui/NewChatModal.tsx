'use client';

import {yupResolver} from '@hookform/resolvers/yup';
import {Button, Input, Modal} from 'antd';
import {observer} from 'mobx-react-lite';
import {useEffect} from 'react';
import {Controller, useForm} from 'react-hook-form';

import {newChatSchema, type NewChatFormValues} from '../model/newChatSchema';
import {useChat} from '../store';

import styles from './NewChatModal.module.scss';

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export const NewChatModal = observer(({open, onClose, onCreated}: Props) => {
  const chatStore = useChat();

  useEffect(() => {
    return () => chatStore.cancelCreateChat();
  }, [chatStore]);

  const {
    control,
    handleSubmit,
    reset,
    formState: {errors},
  } = useForm<NewChatFormValues>({
    resolver: yupResolver(newChatSchema),
    defaultValues: {
      phoneNumber: '',
    },
  });

  const handleClose = () => {
    chatStore.cancelCreateChat();
    reset();
    onClose();
  };

  const handleCreate = handleSubmit(async ({phoneNumber}) => {
    const created = await chatStore.createChat(phoneNumber);

    if (!created) {
      return;
    }

    reset();
    onCreated();
    onClose();
  });

  return (
    <Modal title="Новый чат" open={open} footer={null} onCancel={handleClose} destroyOnHidden>
      <form className={styles.form} onSubmit={handleCreate} noValidate>
        <div>
          <Controller
            name="phoneNumber"
            control={control}
            render={({field}) => (
              <Input
                {...field}
                autoFocus
                size="large"
                placeholder="+7 (999) 123-45-67"
                aria-label="Номер телефона"
                disabled={chatStore.isCreating}
                status={errors.phoneNumber ? 'error' : undefined}
              />
            )}
          />

          {errors.phoneNumber && (
            <p className={styles.error} role="alert">
              {errors.phoneNumber.message}
            </p>
          )}
        </div>

        {chatStore.error && (
          <p className={styles.error} role="alert">
            {chatStore.error}
          </p>
        )}

        <div className={styles.actions}>
          <Button type="default" onClick={handleClose}>
            Отмена
          </Button>

          <Button
            type="primary"
            htmlType="submit"
            loading={chatStore.isCreating}
            disabled={chatStore.isCreating}
          >
            Добавить
          </Button>
        </div>
      </form>
    </Modal>
  );
});
