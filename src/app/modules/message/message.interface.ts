import { Model, Types } from 'mongoose';

export type IMessage = {
  chatId:Types.ObjectId;
  receiver:Types.ObjectId;
  message:string;
  files:string[];
  type:'text' | 'file' | 'both';
  isRead:boolean;
  createdAt:Date;
  updatedAt:Date;
}

export type IMessageFilters = {
  sender_id?: string;
  receiver_id?: string;
}

export type MessageModel = Model<IMessage, IMessageFilters>;