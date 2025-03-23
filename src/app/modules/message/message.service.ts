import { JwtPayload } from "jsonwebtoken";
import mongoose, { Types } from "mongoose";
import { IMessage } from "./message.interface";
import { Chat } from "../chat/chat.model";
import { Message } from "./message.model";
import ApiError from "../../../errors/ApiError";
import { StatusCodes } from "http-status-codes";
import { messageSocketHelper } from "./message.utils";
import { IPaginationOptions } from "../../../types/pagination";
import { paginationHelper } from "../../../helpers/paginationHelper";



const sendMessage = async(user:JwtPayload,chatId:Types.ObjectId,payload:Partial<IMessage>) =>{


    const session = await mongoose.startSession();

    try{
      session.startTransaction();
      
      const requestedUserId = user.id;
    const chat = await Chat.findById(chatId);
    if(!chat){
        throw new ApiError(StatusCodes.BAD_REQUEST,'Requested chat not found.');
    }
    const stringParticipantIds = chat.participants.map((participant: any) => participant._id.toString());
    if(!stringParticipantIds.includes(requestedUserId)){
        throw new ApiError(StatusCodes.BAD_REQUEST,'You are not authorized to send message in this chat.');
    }

    const messageType = payload.message
    ? payload.files && payload.files.length > 0
      ? 'both'  
      : 'text'  
    : 'file';   
    payload.type = messageType;

    const otherUser = chat?.participants.find((participant: any) => participant._id.toString() !== requestedUserId);
    const message = await Message.create({
        chatId,
        receiver: otherUser,
        message: payload.message,
        files: payload.files,
        type: messageType
    })  

    chat.latestMessage = message._id;
    chat.latestMessageTime = new Date();
    if(requestedUserId !== chat.participants[0].toString()){ // Chat creator id is in the first position
        chat.isRequested = false;
    }
    await chat.save({session});

    if(!message) throw new ApiError(StatusCodes.BAD_REQUEST,'Failed to send message');

    const populatedMessage = await message.populate({
        path: 'receiver',
        select: {name: 1, image: 1, _id: 1}
    });

    messageSocketHelper(populatedMessage);

    await session.commitTransaction();
    return message;
    }catch(error){
     await session.abortTransaction();
      throw new ApiError(StatusCodes.BAD_REQUEST,'Failed to send message');
    }finally{
        session.endSession();
    }
   
}



const getMessagesByChatId = async(user:JwtPayload,chatId:Types.ObjectId, pagination:IPaginationOptions) =>{

    const {page, limit, skip, sortBy, sortOrder} = paginationHelper.calculatePagination(pagination);
    const requestedUserId = user.id;

    const chatExist = await Chat.findById(chatId).lean();
    if(!chatExist){
        throw new ApiError(StatusCodes.BAD_REQUEST,'Requested chat not found.');
    }
    
    const stringParticipantIds = chatExist.participants.map((participant: any) => participant._id.toString());


    if(!stringParticipantIds.includes(requestedUserId)){
        throw new ApiError(StatusCodes.BAD_REQUEST,'You are not authorized to access this chat messages.');
    }
    const messages = await Message.find({chatId}).populate({
        path: 'receiver',
        select: {name: 1, image: 1, _id: 1}
    }).skip(skip).limit(limit).sort({[sortBy]: sortOrder});

    const total = await Message.countDocuments({chatId});
    return {
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        },
        data: messages
    };
}


export const messageService = {
    sendMessage,
    getMessagesByChatId
}