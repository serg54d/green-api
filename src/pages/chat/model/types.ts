export type MessageStatus = 'sending' | 'queued' | 'delivered' | 'read' | 'error' | 'unknown';
export interface ChatMessage {
  id: string;
  idMessage?: string;
  text: string;
  time: string;
  direction: 'incoming' | 'outgoing';
  status?: MessageStatus;
  error?: string;
}

export interface Chat {
  id: string;
  title?: string;
  phoneNumber: string;
  messages: ChatMessage[];
}
