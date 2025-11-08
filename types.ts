export enum MessageAuthor {
  USER = 'user',
  BOT = 'bot',
}

export interface ChatMessage {
  id: string;
  author: MessageAuthor;
  content: string;
  image?: string;
}
