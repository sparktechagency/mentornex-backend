import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiError";
import { Schedule } from "./schedule.model";
import { ISchedule } from "./schedule.interface.";

const createScheduleInDB = async (payload: ISchedule): Promise<ISchedule> => {
  // Check if schedule already exists for mentor
  const existingSchedule = await Schedule.findOne({ mentor_id: payload.mentor_id });
  if (existingSchedule) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Schedule already exists for this mentor');
  }

  const schedule = await Schedule.create(payload);
  if (!schedule) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create schedule');
  }
  return schedule;
};

const getScheduleFromDB = async (mentorId: string): Promise<ISchedule> => {
  const schedule = await Schedule.findOne({ mentor_id: mentorId });
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