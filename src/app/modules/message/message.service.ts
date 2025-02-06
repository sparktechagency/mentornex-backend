import { IMessage, IMessageFilters } from './message.interface';
import { Message } from './message.model';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { User } from '../user/user.model';
import { onlineUsers } from '../../../server';
import unlinkFile from '../../../shared/unlinkFile';

const sendMessage = async (payload: IMessage): Promise<IMessage> => {
  const isSenderExist = await User.isExistUserById(payload.sender_id);
  if (!isSenderExist) {
    if (payload.file) {
      unlinkFile(payload.file);
    }
    throw new ApiError(StatusCodes.NOT_FOUND, 'Sender not found');
  }
  const isReceiverExist = await User.isExistUserById(payload.receiver_id);
  if (!isReceiverExist) {
    if (payload.file) {
      unlinkFile(payload.file);
    }
    throw new ApiError(StatusCodes.NOT_FOUND, 'Receiver not found');
  }

  // Check if receiver has ever sent a message in this conversation
  const receiverHasResponded = await Message.findOne({
    sender_id: payload.receiver_id,
    receiver_id: payload.sender_id,
  });

  // Set isMessageRequest based on whether receiver has responded
  payload.isMessageRequest = !receiverHasResponded;

  try {
    const message = await Message.create(payload);
    const populatedMessage = await Message.findById(message._id)
      .populate('sender_id', 'name image')
      .populate('receiver_id', 'name image');

    if (!populatedMessage) {
      if (payload.file) {
        unlinkFile(payload.file);
      }
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to create message'
      );
    }

    // When receiver responds, update all messages in the conversation
    if (payload.sender_id === payload.receiver_id) {
      await Message.updateMany(
        {
          $or: [
            { sender_id: payload.sender_id, receiver_id: payload.receiver_id },
            { sender_id: payload.receiver_id, receiver_id: payload.sender_id }
          ]
        },
        { isMessageRequest: false }
      );
    }

    const receiverSocketId = onlineUsers[payload.receiver_id];
    if (receiverSocketId) {
      (global as any).io
        .to(receiverSocketId)
        .emit('newMessage', populatedMessage);
    }
    return populatedMessage;
  } catch (error) {
    // If message creation fails, delete uploaded file
    if (payload.file) {
      unlinkFile(payload.file);
    }
    throw error;
  }
};
const getRegularConversations = async (userId: string): Promise<IMessage[]> => {
  // Find users with whom the current user has had two-way conversations
  // (both have sent messages to each other)
  const userSentTo = await Message.distinct('receiver_id', {
    sender_id: userId,
  });

  const usersWhoSentToUser = await Message.distinct('sender_id', {
    receiver_id: userId,
  });

  // Find users who both sent to and received from the current user
  const mutualConversationUsers = userSentTo.filter(id =>
    usersWhoSentToUser.includes(id)
  );

  // Get the latest message from each conversation
  const latestMessages = await Message.aggregate([
    {
      $match: {
        $or: [
          {
            sender_id: userId,
            receiver_id: { $in: mutualConversationUsers },
          },
          {
            receiver_id: userId,
            sender_id: { $in: mutualConversationUsers },
          },
        ],
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $group: {
        _id: {
          $cond: [
            { $eq: ['$sender_id', userId] },
            '$receiver_id',
            '$sender_id',
          ],
        },
        latestMessage: { $first: '$$ROOT' },
      },
    },
  ]);

  // Populate user details for the conversations
  const populatedConversations = await Message.populate(
    latestMessages.map(item => item.latestMessage),
    [
      { path: 'sender_id', select: 'name image' },
      { path: 'receiver_id', select: 'name image' },
    ]
  );

  return populatedConversations;
};

const getOneRegularMessage = async (
  userId: string,
  otherUserId: string
): Promise<IMessage[]> => {
  // For sender: show all messages
  // For receiver: show messages only if they've responded or are the sender
  const hasResponded = await Message.findOne({
    sender_id: userId,
    receiver_id: otherUserId,
  });

  let query = {
    $or: [
      { sender_id: userId, receiver_id: otherUserId },
      { sender_id: otherUserId, receiver_id: userId },
    ],
  };

  // If user hasn't responded and they're the receiver, don't show in regular chat
  if (
    !hasResponded &&
    (await Message.findOne({ sender_id: otherUserId, receiver_id: userId }))
  ) {
    return [];
  }

  const messages = await Message.find(query)
    .populate('sender_id', 'name image')
    .populate('receiver_id', 'name image')
    .sort({ createdAt: 1 });

  return messages;
};

const getSenderMessagesFromDB = async (
  userId: string,
  senderId: string
): Promise<IMessage[]> => {
  // Get all messages where:
  // senderId is the sender and userId is the receiver
  const messages = await Message.find({
    sender_id: senderId,
    receiver_id: userId,
  })
    .populate('sender_id', 'name image')
    .populate('receiver_id', 'name image')
    .sort({ createdAt: 1 });

  return messages;
};

const getMessageRequests = async (userId: string): Promise<IMessage[]> => {
  // Find conversations where:
  // 1. User is the receiver
  // 2. User has never sent a message to the sender
  const userSentMessages = await Message.distinct('receiver_id', {
    sender_id: userId,
  });

  const requests = await Message.find({
    receiver_id: userId,
    sender_id: { $nin: userSentMessages },
  })
    .populate('sender_id', 'name image')
    .populate('receiver_id', 'name image')
    .sort({ createdAt: -1 });

  // Group by sender to show only latest message from each sender
  const uniqueRequests = requests.reduce((acc: IMessage[], curr) => {
    const existingRequest = acc.find(
      msg => msg.sender_id.toString() === curr.sender_id.toString()
    );
    if (!existingRequest) {
      acc.push(curr);
    }
    return acc;
  }, []);

  return uniqueRequests;
};

export const MessageService = {
  sendMessage,
  getRegularConversations,
  getOneRegularMessage,
  getSenderMessagesFromDB,
  getMessageRequests,
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
