import { Types } from "mongoose";
import { Chat } from "./chat.model";
import { IChat } from "./chat.interface";
import { IMessage } from "../message/message.interface";

export const formattedChatData = (chatId:Types.ObjectId) =>{
    const chat = Chat.findById(chatId).populate<IChat>({
        path: 'participants',
        select: {name: 1, image: 1, _id: 1}
    }).populate<IMessage>({
        path: 'latestMessage',
        select: {message: 1, type: 1, _id: 1}
    }).lean();   

    return chat;
}
