import { Schema, model } from 'mongoose';
import { INotification, NotificationModel } from './notification.interface';

const notificationSchema = new Schema<INotification, NotificationModel>({
  senderId: {
    type: String,
    ref: 'User',
    required: true,
  },
  receiverId: {
    type: String,
    ref: 'User',
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Notification = model<INotification>(
  'Notification',
  notificationSchema
);
