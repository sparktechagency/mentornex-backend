import { Model, Types } from 'mongoose';

export type IChat = {
  _id: Types.ObjectId;
  participants: Types.ObjectId[];
  latestMessage: Types.ObjectId;
  latestMessageTime: Date;
  isRequested: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type ChatModel = Model<IChat>;
