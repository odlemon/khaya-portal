// @ts-nocheck
export interface ChatParticipant {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  profile?: {
    avatar?: string;
  };
}

export interface Property {
  _id: string;
  title: string;
  address: {
    street: string;
    city: string;
    state?: string;
    zipCode?: string;
  };
  images?: string[];
}

export interface LastMessage {
  content: string;
  senderId: string;
  timestamp: string;
}

export interface Chat {
  _id: string;
  participants: ChatParticipant[];
  propertyId: Property;
  lastMessage?: LastMessage;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  chatId: string;
  senderId: ChatParticipant;
  senderRole: string;
  content: string;
  visibleTo?: string[];
  taggedUser?: string;
  isMine: boolean;
  isPrivate: boolean;
  read?: boolean;
  createdAt: string;
}

export interface AllChatsResponse {
  success: boolean;
  message: string;
  data: {
    chats: Chat[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface ChatResponse {
  success: boolean;
  message: string;
  data: {
    chat: Chat;
    messages: Message[];
  };
}

export interface MessageResponse {
  success: boolean;
  message: string;
  data: Message;
}





