import { StatusCodes } from "http-status-codes";
import { Notification } from "../app/modules/notification/notification.model";
import ApiError from "../errors/ApiError";
import { logger } from "../shared/logger";

const sendNotification = async(namespace: string,{senderId, receiverId, title,message}: {senderId: string, receiverId: string, title: string,message: string}) => {
   
    try{
        const notification = await Notification.create({
            senderId,
            receiverId,
            message,
            title,
            read: false,
            createdAt: new Date(),
        })
    
        if(!notification) throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to send notification');
        const getCreatedNotification = await Notification.findById(notification._id).populate({
            path: 'senderId',
            select: {name: 1, image: 1, _id: 1}
        }).lean();
    
        if(!getCreatedNotification) throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to send notification');
    
        //send notification
        //@ts-ignore
        const socket = global.io;
        socket.emit(`${namespace}::${receiverId}`, {getCreatedNotification});
    }catch(error){
        logger.error('Failed to send notification:', error);
    }
    
}

export default sendNotification;
