import { Schema, model } from 'mongoose';
import { IMessage, MessageModel } from './message.interface';

const messageSchema = new Schema<IMessage, MessageModel>(
{
    chatId: {
      type: Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    files: {
      type: [String],
    },
    message: {
      type: String,
      required: true,
    },
},
  {
    timestamps: true
  }
);

export const Message = model<IMessage, MessageModel>('Message', messageSchema);
