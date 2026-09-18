export type ChatPreview = {
  id: number;
  name: string;
  message: string;
  time: string;
  initials: string;
  tone: 'coral' | 'blue';
};

export interface ChatMessage {
  id: number;
  text: string;
  time: string;
}
