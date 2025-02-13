import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { ScheduleService } from "./schedule.service";

const createSchedule = catchAsync(
  async (req: Request, res: Response) => {
    const mentor_id = req.user.id;
    const scheduleData = { mentor_id, ...req.body };
    
    const result = await ScheduleService.createScheduleInDB(scheduleData);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Schedule created successfully',
      data: result,
    });
  }
);

const getScheduleByMentor = catchAsync(
  async (req: Request, res: Response) => {
    const mentor_id = req.user.id;
    const result = await ScheduleService.getScheduleFromDB(mentor_id);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Schedule retrieved successfully',
      data: result,
    });
  }
);


const getScheduleByMentee = catchAsync(
  async (req: Request, res: Response) => {
    const mentor_id = req.params.mentor_id;
    const result = await ScheduleService.getScheduleFromDB(mentor_id);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Schedule retrieved successfully',
      data: result,
    });
  }
);

const updateSchedule = catchAsync(
  async (req: Request, res: Response) => {
    const mentor_id = req.user.id;
    const result = await ScheduleService.updateScheduleInDB(mentor_id, req.body);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Schedule updated successfully',
      data: result,
    });
  }
);

export const ScheduleController = {
  createSchedule,
  getScheduleByMentor,
  getScheduleByMentee,
  updateSchedule,
};