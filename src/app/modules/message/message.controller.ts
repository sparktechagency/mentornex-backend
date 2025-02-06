import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { IMessage } from './message.interface';
import { MessageService } from './message.service';

const sendMessage = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { content } = req.body;
    const sender_id = req.user.id;
    const receiver_id = req.params.receiver_id;

    const message = await MessageService.sendMessage({
      sender_id,
      receiver_id,
      content
    });

    sendResponse<IMessage>(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Message sent successfully',
      data: message,
    });
  }
);

const getMessageHistory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { receiver_id } = req.params;
    const sender_id = req.user.id;

    const messages = await MessageService.getMessageHistory(
      sender_id,
      receiver_id
    );

    sendResponse<IMessage[]>(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Messages retrieved successfully',
      data: messages,
    });
  }
);

/*const getAllConversations = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?._id;

    const conversations = await MessageService.getAllConversations(userId);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Conversations retrieved successfully',
      data: conversations,
    });
  }
);*/

export const MessageController = {
  sendMessage,
  getMessageHistory
};