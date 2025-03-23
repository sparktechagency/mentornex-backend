import { IMessage } from "./message.interface";

export const messageSocketHelper = (message:IMessage) =>{
    //@ts-ignore
    const socket = global.io;
    socket.emit(`newMessage::${message.chatId}`,message);
}