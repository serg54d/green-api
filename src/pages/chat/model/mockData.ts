import type {ChatMessage, ChatPreview} from './types';
export const chats: ChatPreview[] = [
  {
    id: 1,
    name: 'Сергей Дунаев',
    message: 'Привет',
    time: '20:55',
    initials: 'СД',
    tone: 'coral',
  },
  {
    id: 2,
    name: 'Иван Иванов',
    message: 'Как дела?',
    time: '19:42',
    initials: 'ИИ',
    tone: 'blue',
  },
];

export const messages: ChatMessage[] = [{id: 1, text: 'Привет', time: '20:55'}];
