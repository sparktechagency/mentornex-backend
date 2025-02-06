import { Schema, model } from 'mongoose';
import { IMessage, MessageModel } from './message.interface';

const messageSchema = new Schema<IMessage, MessageModel>(
  {
    sender_id: {
      type: String,
      ref: 'User',
      required: true,
    },
    receiver_id: {
      type: String,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    isMessageRequest: {
      type: Boolean,
      required: true,
      default: true,
    },
    file: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  }
);

export const Message = model<IMessage, MessageModel>('Message', messageSchema);
