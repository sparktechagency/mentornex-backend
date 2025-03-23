import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import { messageService } from "./message.service";
import { Request, Response } from "express";
import { getMultipleFilesPath } from "../../../shared/getFilePath";
import pick from "../../../shared/pick";

const sendMessage = catchAsync(async (req: Request, res: Response) => {
    const { chatId } = req.params;
    
    const payload = {
        message: req?.body?.message ,
        files: getMultipleFilesPath(req.files, 'image')
    };
    const result = await messageService.sendMessage(req.user, new Types.ObjectId(chatId), payload);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Message sent successfully',
      data: result,
    });
  })

  const getMessages = catchAsync(async (req: Request, res: Response) => {
    const { chatId } = req.params;
    const pagination = pick(req.query, ['page', 'limit', 'sort', 'sortBy']);
    const result = await messageService.getMessagesByChatId(req.user, new Types.ObjectId(chatId), pagination);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Messages retrieved successfully',
      data: result,
    });
  })


  export const MessageController = {
    sendMessage,
    getMessages
  }