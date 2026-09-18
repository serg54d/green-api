'use client';
import {chats, messages} from './model/mockData';
import {ChatList} from './ui/ChatList';
import {ChatHeader} from './ui/ChatHeader';
import {MessageList} from './ui/MessageList';
import {MessageComposer} from './ui/MessageComposer';
import styles from './ChatPage.module.scss';

export function ChatPage() {
  return (
    <section className={styles.root}>
      <ChatList chats={chats} />
      <main className={styles.conversation}>
        <ChatHeader chat={chats[0]} />
        <div className={styles.conversationBody}>
          <MessageList messages={messages} />
          <MessageComposer />
        </div>
      </main>
    </section>
  );
}
