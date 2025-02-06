import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { IMessage } from './message.interface';
import { MessageService } from './message.service';
import { getSingleFilePath } from '../../../shared/getFilePath';

const sendMessage = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { content } = req.body;
    const sender_id = req.user.id;
    const receiver_id = req.params.receiver_id;

    const filePath = req.files ? getSingleFilePath(req.files, 'image') || 
                                getSingleFilePath(req.files, 'doc') || 
                                getSingleFilePath(req.files, 'media') 
                              : undefined;
    const message = await MessageService.sendMessage({
      sender_id,
      receiver_id,
      content,
      file: filePath,
      isMessageRequest: true,
    });

    sendResponse<IMessage>(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Message sent successfully',
      data: message,
    });
  }
);

const getRegularConversations = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const userId = req.user.id;
      const conversations = await MessageService.getRegularConversations(userId);
  
      sendResponse<IMessage[]>(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Regular conversations retrieved successfully',
        data: conversations,
      });
    }
  );

const getOneRegularMessage= catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { receiver_id } = req.params;
    const sender_id = req.user.id;

    const messages = await MessageService.getOneRegularMessage(
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

const getSenderMessages = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const userId = req.user.id;  // Current user's ID
      const senderId = req.params.sender_id;  // Sender's ID from URL parameter
  
      const messages = await MessageService.getSenderMessagesFromDB(userId, senderId);
  
      sendResponse<IMessage[]>(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Sender messages retrieved successfully',
        data: messages,
      });
    }
  );

const getMessageRequests = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const userId = req.user.id;
      const requests = await MessageService.getMessageRequests(userId);
  
      sendResponse<IMessage[]>(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Message requests retrieved successfully',
        data: requests,
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
  getRegularConversations,
  getOneRegularMessage,
  getSenderMessages,
  getMessageRequests
};