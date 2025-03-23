import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiError";
import { Schedule } from "./schedule.model";
import { ISchedule } from "./schedule.interface.";
import { Types } from "mongoose";
import { DateTime } from "luxon";
import { JwtPayload } from "jsonwebtoken";
import { User } from "../user/user.model";

const createScheduleInDB = async (user: JwtPayload, payload: ISchedule) => {
  // Fetch the user's time zone
  const isUserExist = await User.findById(user.id).select("timeZone").lean();
  if (!isUserExist) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Required user not found.');
  }

  // Format the schedule
  const formattedSchedule = payload.schedule.map(daySchedule => {
    const formattedTimes = daySchedule.times.map((timeString: any) => {

      // Parse the time string in the mentor's time zone
      const localTime = DateTime.fromFormat(timeString, 'h:mm a', { zone: isUserExist.timeZone });
      console.log(localTime)
      // Debug the localTime to see if it's parsed correctly
      if (!localTime.isValid) {
        console.error(`Failed to parse time: ${timeString} with timezone: ${isUserExist.timeZone}`);
        throw new ApiError(StatusCodes.BAD_REQUEST, `Invalid time format: ${timeString}`);
      }

      // Convert the time to UTC
      const utcTime = localTime.toUTC();

      // Generate timeCode (e.g., 10:00 AM -> 1000, 2:00 PM -> 1400)
      const timeCode = utcTime.hour * 100 + utcTime.minute;

      console.log(`Generated timeCode: ${timeCode}`);

      // Check if the timeCode is valid (e.g., not NaN)
      if (isNaN(timeCode)) {
        console.error(`Invalid timeCode generated for ${timeString}`);
        throw new ApiError(StatusCodes.BAD_REQUEST, `Failed to generate valid timeCode for ${timeString}`);
      }

      return {
        time: utcTime.toFormat('hh:mm a'), // Store the UTC time in a readable format
        timeCode, // Numeric time code
      };
    });



    return {
      day: daySchedule.day,
      times: formattedTimes,
    };
  });


  await Schedule.create({
    mentor_id: user.id,
    timeZone: isUserExist.timeZone,
    schedule: formattedSchedule,
  });

  return formattedSchedule;
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