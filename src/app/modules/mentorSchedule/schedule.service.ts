import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiError";
import { Schedule } from "./schedule.model";
import { ISchedule } from "./schedule.interface.";
import { Types } from "mongoose";
import { DateTime } from "luxon";
import { JwtPayload } from "jsonwebtoken";
import { User } from "../user/user.model";
import {  convertScheduleToLocal, formatSchedule } from "./schedule.utils";

const createScheduleInDB = async (user: JwtPayload, payload: ISchedule) => {
  // Fetch the user's time zone
  const [isUserExist, isScheduleExist] = await Promise.all([
    User.findById(user.id).select("timeZone").lean(),
    Schedule.findOne({ mentor_id: user.id }).lean()
  ]); 

  if (!isUserExist) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Required user not found.');
  }



  const formattedSchedule = formatSchedule(payload, isUserExist.timeZone);

  if (isScheduleExist) {
   const result = await Schedule.findByIdAndUpdate(isScheduleExist._id, { schedule: formattedSchedule }, { new: true });
   return result;
  }
  

  await Schedule.create({
    mentor_id: user.id,
    timeZone: isUserExist.timeZone,
    schedule: formattedSchedule,
  });

  return formattedSchedule;
};


const getScheduleFromDB = async ( user: JwtPayload,mentorId?: string) => {
  // const userId = mentorId ? new Types.ObjectId(mentorId) : new Types.ObjectId(user.id);
  const [schedule, isUserExist] = await Promise.all([
    Schedule.findOne({ mentor_id: mentorId }).lean(),
    User.findById(user.id).select("timeZone").lean()
  ]);
  if (!schedule) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Schedule not found');
  }

  if(!isUserExist) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Required user not found.');
  }

  const convertedSchedule = convertScheduleToLocal(schedule, isUserExist.timeZone);
  return convertedSchedule;
  
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