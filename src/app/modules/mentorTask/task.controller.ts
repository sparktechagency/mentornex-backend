import { NextFunction, Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { TaskService } from "./task.service";

const addTask = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const mentor_id = req.user.id;
      const task = {mentor_id, ...req.body};
      const result = await TaskService.addTaskToDB(task);
  
      sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Task added successfully',
        data: result,
      });
    }

  );

const getAllTask = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const mentorId = req.user.id;
      const result = await TaskService.getAllTaskFromDB(mentorId);

      sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Task fetched successfully',
        data: result,
      });
    }
)

 export const TaskController = {
    addTask,
    getAllTask
 }