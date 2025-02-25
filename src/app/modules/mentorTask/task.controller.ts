import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { TaskService } from './task.service';
import { getSingleFilePath } from '../../../shared/getFilePath';

const addTask = catchAsync(async (req: Request, res: Response) => {
  const mentor_id = req.user.id;
  const filePath = req.files
    ? getSingleFilePath(req.files, 'image') ||
      getSingleFilePath(req.files, 'doc') ||
      getSingleFilePath(req.files, 'media')
    : undefined;
  const task = { mentor_id, filePath, ...req.body };
  const result = await TaskService.addTaskToDB(task);

  if (!result) {
    sendResponse(res, {
      success: false,
      statusCode: StatusCodes.NOT_FOUND,
      message: 'Task not added',
    });
  }

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Task added successfully',
    data: result,
  });
});

const getAllTask = catchAsync(async (req: Request, res: Response) => {
  const mentorId = req.user.id;
  const result = await TaskService.getAllTaskFromDB(mentorId);

  if (!result) {
    sendResponse(res, {
      success: false,
      statusCode: StatusCodes.NOT_FOUND,
      message: 'Tasks not found',
    });
  }

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Tasks fetched successfully',
    data: result,
  });
});

const getTaskByMentee = catchAsync(async (req: Request, res: Response) => {
  const menteeId = req.user.id;
  const mentorId = req.params.mentor_id;
  const result = await TaskService.getTaskByMenteeFromDB(mentorId, menteeId);

  if (!result) {
    sendResponse(res, {
      success: false,
      statusCode: StatusCodes.NOT_FOUND,
      message: 'Task not found',
    });
  }
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Task fetched successfully',
    data: result,
  });
});

export const TaskController = {
  addTask,
  getAllTask,
  getTaskByMentee,
};
