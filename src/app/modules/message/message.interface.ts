import { Model } from 'mongoose';

export type IMessage = {
  sender_id: string;
  receiver_id: string;
  content: string;
  isMessageRequest: boolean;
  file?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type IMessageFilters = {
  sender_id?: string;
  receiver_id?: string;
}

export type MessageModel = Model<IMessage, IMessageFilters>;