import { Model } from 'mongoose';

export type INotification = {
    senderId: string;
    receiverId: string;
    message: string;
    title: string;
    read: boolean;
    createdAt: Date;
  }
export type NotificationModel = Model<INotification, Record<string, unknown>>;
