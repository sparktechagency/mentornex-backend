import colors from 'colors';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import app from './app';
import config from './config';
import { seedSuperAdmin } from './DB/seedAdmin';
import { socketHelper } from './helpers/socketHelper';
import { errorLogger, logger } from './shared/logger';
import { jwtHelper } from './helpers/jwtHelper';
import { Notification } from './app/modules/notification/notification.model';

//uncaught exception
process.on('uncaughtException', error => {
  errorLogger.error('UnhandleException Detected', error);
  process.exit(1);
});

let server: any;
export const onlineUsers: { [key: string]: string } = {};
async function main() {
  try {
    mongoose.connect(config.database_url as string);
    logger.info(colors.green('🚀 Database connected successfully'));

    //Seed Super Admin after database connection is successful
    await seedSuperAdmin();

    const port =
      typeof config.port === 'number' ? config.port : Number(config.port);

    server = app.listen(port, config.ip_address as string, () => {
      logger.info(
        colors.yellow(`♻️  Application listening on port:${config.port}`)
      );
    });

    //socket
    const io = new Server(server, {
      pingTimeout: 60000,
      cors: {
        origin: '*',
      },
    });
    socketHelper.socket(io);
    //@ts-ignore
    global.io = io;

    io.on('connection', socket => {
      console.log(`User connected----: ${socket.id}`);

      socket.on('authenticate', async (data: { token: string }) => {
        console.log(data.token);
        try {
          const { token } = data;
          const { id } = jwtHelper.verifyToken(
            token,
            config.jwt.jwt_secret as string
          );

          onlineUsers[id] = socket.id;
          console.log(
            `User ID ${id} authenticated with socket ID ${socket.id}`
          );

          // Fetch unread notifications for this user
          const unreadNotifications = await Notification.find({
            receiverId: id,
            read: false,
          }).sort({ createdAt: -1 });

          // Send unread notifications to the user
          if (unreadNotifications.length > 0) {
            socket.emit(`pendingNotifications::${id}`, unreadNotifications);
          }

          socket.emit('authenticated', { success: true });
        } catch (error) {
          socket.emit('authenticated', { success: false });
        }
      });

      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
      });
    });
  } catch (error) {
    errorLogger.error(colors.red('🤢 Failed to connect Database'));
    logger.error(error);
  }

  //handle unhandleRejection
  process.on('unhandledRejection', error => {
    if (server) {
      server.close(() => {
        errorLogger.error('UnhandleRejection Detected', error);
        process.exit(1);
      });
    } else {
      process.exit(1);
    }
  });
}

main();

//SIGTERM
process.on('SIGTERM', () => {
  logger.info('SIGTERM IS RECEIVE');
  if (server) {
    server.close();
  }
});

//export {onlineUsers}
