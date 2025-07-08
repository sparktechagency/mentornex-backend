import { Request, Response, NextFunction } from 'express';
import { ChatServices } from './chat.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';


const createChat = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.body;
      ;
      const result = await ChatServices.createChat(req.user, new Types.ObjectId(id));
      sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Chat created successfully',
        data: result,
      });
    }
  );

  const getChatList = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const user = req.user;
      const result = await ChatServices.getChatList(user);
      sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Chat list retrieved successfully',
        data: result,
      });
    }
  );

export const ChatController = { createChat, getChatList };
