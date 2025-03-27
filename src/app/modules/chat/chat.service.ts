import { JwtPayload } from 'jsonwebtoken';
import {  IChat } from './chat.interface';
import { Chat } from './chat.model';
import { Types } from 'mongoose';
import { formattedChatData } from './chat.util';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { logger } from '../../../shared/logger';
import sendNotification from '../../../helpers/sendNotificationHelper';
import { IMessage } from '../message/message.interface';

const createChat = async(user:JwtPayload,participantId:Types.ObjectId) =>{

    const requestedUserId = user.id;
    const participants = [requestedUserId,participantId];

    const isChatExist = await Chat.findOne({
        participants: {$all: participants}
    })


    if(isChatExist){
        const formattedChat = await formattedChatData(isChatExist._id, requestedUserId);
        return formattedChat;
    }

    const chat = await Chat.create({
        participants,
    })

    if(!chat) throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create chat');

    const formattedChat = await formattedChatData(chat._id, requestedUserId);

    
    // Instead of using `forEach`, you could also optimize with `for...of`
    //@ts-ignore
    const socket = global.io;
    for (const participant of participants) {
        socket.emit(`newChat::${participant}`, formattedChat);
    }

    try{
        await sendNotification('getNotification',{
            senderId: requestedUserId,
            receiverId: participantId.toString(),
            title: `${formattedChat?.participant?.name} has sent you a message request.`,
            message: 'Please send a message to accept or reject the request.',
        })
    }catch(error){
        logger.error("Failed to send notification", error);
    }


    return formattedChat;
}


const getChatList = async(user:JwtPayload) =>{
    const requestedUserId = user.id;
    const chatList = await Chat.find({
        participants: {$all: [requestedUserId]}
    }).populate<IChat>({
        path: 'participants',
        select: {name: 1, image: 1, _id: 1}
    }).populate<{latestMessage: IMessage}>({
        path: 'latestMessage',
        select: {message: 1, isRead:1, type: 1, _id: 1}
    });


   const formattedChatList = chatList.map(chat => {  
        const otherUser = chat.participants.find((participant: any) => participant._id.toString() !== requestedUserId) as {name: string, image: string, _id: Types.ObjectId} | undefined;
        const returnableData = {
            _id: chat._id,
            participant: otherUser,
            latestMessage: chat.latestMessage?.message ? chat.latestMessage.message : chat.latestMessage?.type || '',
            isRead: chat.latestMessage?.isRead || false,
            isRequest: chat.isRequested,
            createdAt: chat.createdAt,
            updatedAt: chat.updatedAt
        }
        return returnableData;
    })

    
    //create two chat list one for message with isRequest false and another for request with isRequest true
    const messageChatList = formattedChatList.filter((chat,index) => !chat.isRequest || (chatList[index].participants[0]._id.toString() === user.id));
    const requestChatList = formattedChatList.filter((chat, index) => chat.isRequest && chatList[index].participants[0]._id.toString() !== user.id);

    return {messages:messageChatList, requests:requestChatList};
}

export const ChatServices = { createChat, getChatList };
