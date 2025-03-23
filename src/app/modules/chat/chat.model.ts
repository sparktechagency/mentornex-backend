import { Schema, model } from 'mongoose';
import { IChat, ChatModel } from './chat.interface'; 

const chatSchema = new Schema<IChat, ChatModel>({
  participants: {
    type: [Schema.Types.ObjectId],
    required: true,
    ref: 'User',
  },
  latestMessage: {
    type: Schema.Types.ObjectId,
    ref: 'Message',
  },
  latestMessageTime: {
    type: Date,
    default: new Date(),
  },
  isRequested: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

export const Chat = model<IChat, ChatModel>('Chat', chatSchema);
