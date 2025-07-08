import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { ScheduleService } from "./schedule.service";

const createSchedule = catchAsync(
  async (req: Request, res: Response) => {
    console.log(req.body)
    const scheduleData = { ...req.body };
    
    const result = await ScheduleService.createScheduleInDB(req.user,scheduleData);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Schedule created successfully',
      data: result,
    });
  }
);

const getMentorSchedule = catchAsync(
  async (req: Request, res: Response) => {
    const mentorId = req.query.mentorId;
    const result = await ScheduleService.getScheduleFromDB(req.user,mentorId as string);


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

const getAvailableSlots = catchAsync(
  async (req: Request, res: Response) => {
    const mentorId = req.params.mentorId;
    const date = req.query.date;
    const result = await ScheduleService.getAvailableSlots(req.user, mentorId as string, date as string);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Available slots retrieved successfully',
      data: result,
    });
  }
);

export const ScheduleController = {
  createSchedule,
  getMentorSchedule,

  updateSchedule,
  getAvailableSlots
};