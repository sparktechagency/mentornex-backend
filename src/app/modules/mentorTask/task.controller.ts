import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { TaskService } from './task.service';
import { getSingleFilePath } from '../../../shared/getFilePath';
import pick from '../../../shared/pick';
import { paginationConstants } from '../../../types/pagination';

const addTask = catchAsync(async (req: Request, res: Response) => {
  const mentor_id = req.user.id;
  const filePath = req.files
    ? getSingleFilePath(req.files, 'image') ||
      getSingleFilePath(req.files, 'doc') ||
      getSingleFilePath(req.files, 'media') 
    : undefined;
  const task = { mentor_id, file:filePath, ...req.body };
  const result = await TaskService.addTaskToDB(task);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Task added successfully',
    data: result,
  });
});

const getAllTask = catchAsync(async (req: Request, res: Response) => {

  const pagination = pick(req.query, paginationConstants);
  const result = await TaskService.getAllTaskFromDB(req.user, pagination);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Tasks fetched successfully',
    data: result,
  });
});

const getTaskByMenteeOrMentor = catchAsync(async (req: Request, res: Response) => {

  const result = await TaskService.getTaskByMenteeOrMentor(req.user);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Task fetched successfully',
    data: result,
  });
});


const deleteTask = catchAsync(async (req: Request, res: Response) => {
  const result = await TaskService.deleteTask(req.params.id, req.user);


  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Task deleted successfully',
    data: result,
  });
});

const getSingleTask = catchAsync(async (req: Request, res: Response) => {
  const result = await TaskService.getSingleTask(req.params.id, req.user);

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
  getTaskByMenteeOrMentor,
  deleteTask,
  getSingleTask
};
