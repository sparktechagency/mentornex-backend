import { Model } from 'mongoose';

export interface IMessage {
  sender_id: string;
  receiver_id: string;
  content: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IMessageFilters {
  sender_id?: string;
  receiver_id?: string;
}

export type MessageModel = Model<IMessage, IMessageFilters>;