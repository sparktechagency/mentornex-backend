/*import { NextFunction, Request, Response } from 'express';
import catchAsync from '../../../../shared/catchAsync';
import ApiError from '../../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import sendResponse from '../../../../shared/sendResponse';


const createAbout = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { title, description } = req.body;
    if (!title || !description) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Title and description are required'
      );
    }
    const result = await AboutService.createAbout(title, description);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'About created successfully',
      data: result,
    });
  }
);*/
