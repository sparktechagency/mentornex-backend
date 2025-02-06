import { IMessage, IMessageFilters } from './message.interface';
import { Message } from './message.model';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { User } from '../user/user.model';
import { onlineUsers } from '../../../server';

const sendMessage = async (payload: IMessage): Promise<IMessage> => {
  const isSenderExist = await User.isExistUserById(payload.sender_id);
  if (!isSenderExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Sender not found');
  }
  const isReceiverExist = await User.isExistUserById(payload.receiver_id);
  if (!isReceiverExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Receiver not found');
  }
  const message = await Message.create(payload);
  const populatedMessage = await Message.findById(message._id)
    .populate('sender_id', 'name image')
    .populate('receiver_id', 'name image');

  if (!populatedMessage) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to create message'
    );
  }
  const receiverSocketId = onlineUsers[payload.receiver_id];
 
  if (receiverSocketId) {
    (global as any).io
      .to(receiverSocketId)
      .emit('newMessage', populatedMessage);
  }
  return populatedMessage;
};

const getMessageHistory = async (
  sender_id: string,
  receiver_id: string
): Promise<IMessage[]> => {
  // Get messages where user is either sender or receiver
  const messages = await Message.find({
    $or: [
      { sender_id, receiver_id },
      { sender_id: receiver_id, receiver_id: sender_id },
    ],
  })
    .populate('sender_id', 'name image')
    .populate('receiver_id', 'name image')
    .sort({ createdAt: 1 });

  return messages;
};

/*const getAllConversations = async (userId: string) => {
  // Get all unique conversations for the user
  const messages = await Message.find({
    $or: [{ sender_id: userId }, { receiver_id: userId }]
  })
    .populate('sender_id', 'name email image')
    .populate('receiver_id', 'name email image')
    .sort({ createdAt: -1 });

  // Get unique conversations
  const conversations = messages.reduce((acc: any[], message) => {
    const otherUser = message.sender_id.toString() === userId 
      ? message.receiver_id 
      : message.sender_id;
    
    if (!acc.find(conv => 
      conv.otherUser._id.toString() === otherUser._id.toString()
    )) {
      acc.push({
        otherUser,
        lastMessage: message,
        timestamp: message.createdAt
      });
    }
    return acc;
  }, []);

  return conversations;
};*/

export const MessageService = {
  sendMessage,
  getMessageHistory,
};
