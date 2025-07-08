import { Request, Response, NextFunction } from 'express';
import { ContentServices } from './content.service';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';

const addContent = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const payload = req.body;
    const user = req.user;
    payload.mentor = user.id;
    const result = await ContentServices.addContent(payload);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Content added successfully',
      data: result,
    });
  }
);

const updateContent = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const payload = req.body;
    const user = req.user;
    payload.mentor = user.id;
    const result = await ContentServices.updateContent(id, payload);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Content updated successfully',
      data: result,
    });
  }
);

const deleteContent = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const user = req.user;
    const result = await ContentServices.deleteContent(id, user);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Content deleted successfully',
      data: result,
    });
  }
);

const getAllContent = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await ContentServices.getAllContent(req.query);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Content fetched successfully',
      data: result,
    });
  }
);

const getContentForValidMentees = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    const result = await ContentServices.getContentForValidMentees(
      user,
      req.params.id
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Content fetched successfully',
      data: result,
    });
  }
);

export const ContentController = {
  addContent,
  updateContent,
  deleteContent,
  getAllContent,
  getContentForValidMentees,
};
