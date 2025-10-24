// @ts-nocheck
export interface ChatParticipant {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
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
  createdAt: string;
}





