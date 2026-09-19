export interface ChatMessage {
  id: string;
  text: string;
  time: string;
  direction: 'incoming' | 'outgoing';
}

export interface Chat {
  id: string;
  phoneNumber: string;
  messages: ChatMessage[];
}