import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiError";
import { Schedule } from "./schedule.model";
import { ISchedule } from "./schedule.interface.";
import { Types } from "mongoose";

const createScheduleInDB = async (payload: ISchedule): Promise<ISchedule> => {
  // Check if schedule already exists for mentor
  const existingSchedule = await Schedule.findOne({ mentor_id: payload.mentor_id });
  if (existingSchedule) {
    //replace the schedule 
    const updatedData = await Schedule.findOneAndUpdate(
      { mentor_id: payload.mentor_id },
      payload,
      { new: true, upsert: true }
    );
    if (!updatedData) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to update schedule');
    }
    return updatedData;
  }

  const schedule = await Schedule.create(payload);
  if (!schedule) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create schedule');
  }
  return schedule;
};

const getScheduleFromDB = async (mentorId: string): Promise<ISchedule> => {
  const schedule = await Schedule.findOne({ mentor_id: new Types.ObjectId(mentorId) });
  if (!schedule) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Schedule not found');
  }
  return schedule;
};

const updateScheduleInDB = async (
  mentorId: string,
  payload: Partial<ISchedule>
): Promise<ISchedule | null> => {
  const schedule = await Schedule.findOneAndUpdate(
    { mentor_id: mentorId },
    payload,
    { new: true }
  );
  
  if (!schedule) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Schedule not found');
  }
  return schedule;
};

export const ScheduleService = {
  createScheduleInDB,
  getScheduleFromDB,
  updateScheduleInDB,
};