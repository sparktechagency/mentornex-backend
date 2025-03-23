import { Types } from "mongoose";
import { Chat } from "./chat.model";
import { IMessage } from "../message/message.interface";
import { IUser } from "../user/user.interface";

export const formattedChatData = async(chatId:Types.ObjectId, requestedUserId:Types.ObjectId) =>{
    const chat =await Chat.findById(chatId).populate<{_id: Types.ObjectId, participants: IUser[], latestMessage: IMessage}>({
        path: 'participants',
        select: {name: 1, image: 1, _id: 1}
    }).populate<IMessage>({
        path: 'latestMessage',
        select: {message: 1, type: 1, _id: 1}
    }).lean();   

    const requestedUser = chat?.participants.find((participant: any) => participant._id.toString() === requestedUserId) ;
    const otherUser = chat?.participants.find((participant: any) => participant._id.toString() !== requestedUserId);


    const manageReturnableData = (flag: boolean) => {
        return {
            _id: chat?._id,
            participant: flag ? otherUser : requestedUser,
            latestMessage: chat?.latestMessage || '',
            isRequest: chat?.isRequested,
            createdAt: chat?.createdAt,
            updatedAt: chat?.updatedAt
        };
    };
    return manageReturnableData(true);
}
