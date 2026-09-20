'use client';

import {observer} from 'mobx-react-lite';
import {useState} from 'react';
import {Alert} from 'antd';

import styles from './ChatPage.module.scss';
import {useChat} from './store';
import {ChatHeader} from './ui/ChatHeader';
import {ChatList} from './ui/ChatList';
import {MessageComposer} from './ui/MessageComposer';
import {MessageList} from './ui/MessageList';
import {NewChatModal} from './ui/NewChatModal';

export const ChatPage = observer(() => {
  const chatStore = useChat();

  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isConversationOpen, setIsConversationOpen] = useState(false);

  const activeChat = chatStore.activeChat;

  const handleOpenNewChat = () => {
    chatStore.clearError();
    setIsNewChatOpen(true);
  };

  const handleSelectChat = (chatId: string) => {
    chatStore.selectChat(chatId);
    setIsConversationOpen(true);
  };

  return (
    <div className={styles.page}>
      {chatStore.notificationSettingsWarning && (
        <Alert
          type="warning"
          showIcon
          title="Проверьте настройки GREEN-API"
          description={chatStore.notificationSettingsWarning}
        />
      )}

      {chatStore.notificationWarning && (
        <Alert
          type="warning"
          showIcon
          title="Не удалось отобразить сообщение"
          description={chatStore.notificationWarning}
          onClose={() => chatStore.clearNotificationWarning()}
        />
      )}

      {chatStore.pollingError && (
        <Alert
          type="error"
          showIcon
          title="Нет обновлений от GREEN-API"
          description={chatStore.pollingError}
        />
      )}

      <section
        className={`${styles.root} ${isConversationOpen ? styles.mobileConversationOpen : ''}`}
      >
        <div className={styles.chatListPane}>
          <ChatList
            chats={chatStore.chats}
            activeChatId={chatStore.activeChatId}
            onAdd={handleOpenNewChat}
            onSelect={handleSelectChat}
          />
        </div>

        <main className={styles.conversation}>
          {activeChat ? (
            <>
              <ChatHeader chat={activeChat} onBack={() => setIsConversationOpen(false)} />

              <div className={styles.conversationBody}>
                <MessageList messages={activeChat.messages} />

                <MessageComposer
                  value={chatStore.getDraft(activeChat.id)}
                  isSending={chatStore.isChatSending(activeChat.id)}
                  onChange={(value) => {
                    chatStore.setDraft(activeChat.id, value);
                  }}
                  onSend={() => {
                    void chatStore.sendMessage(activeChat.id, chatStore.getDraft(activeChat.id));
                  }}
                />
              </div>
            </>
          ) : (
            <div className={styles.emptyConversation}>Выберите чат</div>
          )}
        </main>
      </section>

      <NewChatModal
        open={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        onCreated={() => setIsConversationOpen(true)}
      />
    </div>
  );
});
