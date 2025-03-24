import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { getSingleFilePath } from '../../../shared/getFilePath';
import { SubmitService } from './submit.service';
import { Types } from 'mongoose';

const createSubmit = catchAsync(async (req: Request, res: Response) => {
  const menteeId = req.user.id;
  const taskId = req.params.taskId;
  const file = req.files
      ? getSingleFilePath(req.files, 'image') ||
        getSingleFilePath(req.files, 'doc') ||
        getSingleFilePath(req.files, 'media')
      : undefined;
  const data = { menteeId, taskId, file, ...req.body };
  const result = await SubmitService.createSubmitToDB(data);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Task submitted successfully',
    data: result,
  });
});


const createFeedback = catchAsync(async (req: Request, res: Response) => {
  const taskId = req.params.taskId;
  const feedback = {taskId, ...req.body};
  const result = await SubmitService.createFeedbackToDB(feedback);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Feedback submitted successfully',
    data: result
  });
})

const getSubmissionByTask = catchAsync(async (req: Request, res: Response) => {
  const taskId = req.params.taskId;
  const result = await SubmitService.getSubmissionByTask(req.user, new Types.ObjectId(taskId));
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Task fetched successfully',
    data: result
  });
})

export const SubmitController = {
  createSubmit,
  createFeedback,
  getSubmissionByTask
};