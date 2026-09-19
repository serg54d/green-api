'use client';

import {observer} from 'mobx-react-lite';
import {useState} from 'react';

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
    const [isConversationOpen, setIsConversationOpen] =
        useState(false);

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
        <>
            <section
                className={`${styles.root} ${
                    isConversationOpen
                        ? styles.mobileConversationOpen
                        : ''
                }`}
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
                            <ChatHeader
                                chat={activeChat}
                                onBack={() => setIsConversationOpen(false)}
                            />

                            <div className={styles.conversationBody}>
                                <MessageList messages={activeChat.messages} />

                                <MessageComposer disabled />
                            </div>
                        </>
                    ) : (
                        <div className={styles.emptyConversation}>
                            Выберите чат
                        </div>
                    )}
                </main>
            </section>

            <NewChatModal
                open={isNewChatOpen}
                onClose={() => setIsNewChatOpen(false)}
                onCreated={() => setIsConversationOpen(true)}
            />
        </>
    );
});