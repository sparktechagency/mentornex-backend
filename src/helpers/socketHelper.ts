import colors from 'colors';
import { Server } from 'socket.io';
import { logger } from '../shared/logger';
import { onlineUsers } from '../server';

const socket = (io: Server) => {
  io.on('connection', socket => {
    logger.info(colors.blue('A user connected'));

    //disconnect
    socket.on('disconnect', () => {
      logger.info(colors.red('A user disconnect'));
    });
  });
};

const sendNotification = (receiverId: string, data: any) => {
  const socketId = onlineUsers[receiverId];
  if (socketId) {
    (global as any).io.to(socketId).emit('newNotification', data);
    return true;
  }
  return false;
};

export const socketHelper = { socket, sendNotification };