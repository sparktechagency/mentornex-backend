import { Model, Types } from 'mongoose';

export type INotification = {
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  message: string;
  title: string;
  read: boolean;
  createdAt: Date;
};
export type NotificationModel = Model<INotification, Record<string, unknown>>;
