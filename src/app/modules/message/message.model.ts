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
    type: {
      type: String,
      enum: ['text', 'file', 'both'],
      required: true,
    },
    message: {
      type: String,
  
    },
},
  {
    timestamps: true
  }
);

export const Message = model<IMessage, MessageModel>('Message', messageSchema);
