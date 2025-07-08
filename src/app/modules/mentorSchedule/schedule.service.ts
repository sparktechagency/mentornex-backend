import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { Schedule } from './schedule.model';
import { ISchedule } from './schedule.interface.';
import { Types } from 'mongoose';
import { DateTime } from 'luxon';
import { JwtPayload } from 'jsonwebtoken';
import { User } from '../user/user.model';
import {
  convertScheduleToLocal,
  formatSchedule,
  getDateWiseSlotCount,
  getNextThreeDates,
  getTimeCodes,
} from './schedule.utils';
import { Session } from '../sessionBooking/session.model';
import { SESSION_STATUS } from '../sessionBooking/session.interface';
import {
  convertSessionTimeToLocal,
  convertSessionTimeToUTC,
  convertSlotTimeToLocal,
} from '../../../helpers/date.helper';
import { USER_ROLES } from '../../../enums/user';

const createScheduleInDB = async (user: JwtPayload, payload: ISchedule) => {
  // Fetch the user's time zone
  const [isUserExist, isScheduleExist] = await Promise.all([
    User.findById(user.id).select('timeZone').lean(),
    Schedule.findOne({ mentor_id: user.id }).lean(),
  ]);

  if (!isUserExist) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Required user not found.');
  }

  const formattedSchedule = formatSchedule(payload, isUserExist.timeZone);

  if (isScheduleExist) {
    const result = await Schedule.findByIdAndUpdate(
      isScheduleExist._id,
      { schedule: formattedSchedule },
      { new: true }
    );
    return result;
  }

  await Schedule.create({
    mentor_id: user.id,
    timeZone: isUserExist.timeZone,
    schedule: formattedSchedule,
  });

  return formattedSchedule;
};

const getScheduleFromDB = async (user: JwtPayload, mentorId?: string) => {
  // const userId = mentorId ? new Types.ObjectId(mentorId) : new Types.ObjectId(user.id);
  const [schedule, isUserExist] = await Promise.all([
    Schedule.findOne({ mentor_id: mentorId }).lean(),
    User.findById(user.id).select('timeZone').lean(),
  ]);
  if (!schedule) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Schedule not found');
  }

  if (!isUserExist) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Required user not found.');
  }

  const convertedSchedule = convertScheduleToLocal(
    schedule,
    isUserExist.timeZone
  );
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

const getAvailableSlots = async (
  user: JwtPayload,
  mentorId: string,
  date: string
) => {
  const [schedule, isUserExist] = await Promise.all([
    Schedule.findOne({ mentor_id: mentorId }).lean(),
    User.findById(user.id).select('timeZone').lean(),
  ]);
  if (!schedule) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Schedule not found');
  }
  if (!isUserExist) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Required user not found.');
  }

  const today = DateTime.now();
  const dates = getNextThreeDates(date || today.toFormat('dd-MM-yyyy'));

  const slotCount = getDateWiseSlotCount(schedule, dates);

  const startDate = DateTime.fromFormat(dates[0].date, 'dd-MM-yyyy');
  const endDate = DateTime.fromFormat(dates[2].date, 'dd-MM-yyyy');
  const sessions = await Session.find({
    mentor_id: mentorId,
    scheduled_time: {
      $gte: startDate.toJSDate(),
      $lte: endDate.toJSDate(),
    },
    status: {
      $in: [
        SESSION_STATUS.PENDING,
        SESSION_STATUS.ACCEPTED,
        SESSION_STATUS.RESCHEDULED,
      ],
    },
  })
    .populate<{ mentee_id: { _id: Types.ObjectId; timeZone: string } }>({
      path: 'mentee_id',
      select: { _id: 1, timeZone: 1 },
    })
    .lean();

  // Define requestedUserTimeZone here so it's available for both cases
  const requestedUserTimeZone = isUserExist.timeZone;

  // Handle case when there are no sessions
  if (sessions.length === 0) {
    return slotCount.map(bookings => {
      return {
        ...bookings,
        slots:
          schedule.schedule
            .find(
              scheduleDay =>
                scheduleDay.day.toLowerCase() === bookings.day.toLowerCase()
            )
            ?.times.map(timeSlot => {
              const { time } = convertSlotTimeToLocal(
                timeSlot.timeCode.toString(),
                requestedUserTimeZone
              );
              return {
                time: time,
                timeCode: timeSlot.timeCode.toString(),
                isAvailable: true, // all slots are available when there are no sessions
              };
            }) || [],
      };
    });
  }

  // now count total booking for each day and calculate each day remaining slot by subtracting total booking from slot
  const totalBookings = slotCount.map(day => {
    return {
      ...day,
      totalBookings: sessions.filter(
        session =>
          DateTime.fromJSDate(session.scheduled_time).toFormat('dd-MM-yyyy') ===
          day.date
      ).length,
    };
  });

  // Process all sessions to get booked time slots for each day
  const bookedSlots = sessions.map(session => {
    const { startTimeCode, endTimeCode } = getTimeCodes(
      session.scheduled_time,
      session.end_time,
      requestedUserTimeZone
    );
    return {
      date: DateTime.fromJSDate(session.scheduled_time).toFormat('dd-MM-yyyy'),
      startTimeCode,
      endTimeCode,
    };
  });

  const slotAvailability = totalBookings.map(bookings => {
    // Get all sessions for this specific day
    const dayBookedSlots = bookedSlots.filter(
      slot => slot.date === bookings.date
    );

    return {
      ...bookings,
      slots:
        schedule.schedule
          .find(
            scheduleDay =>
              scheduleDay.day.toLowerCase() === bookings.day.toLowerCase()
          )
          ?.times.map(timeSlot => {
            const { time } = convertSlotTimeToLocal(
              timeSlot.timeCode.toString(),
              requestedUserTimeZone
            );

            // Check if this slot is booked in any session for this day
            const isSlotBooked = dayBookedSlots.some(
              slot =>
                timeSlot.timeCode >= slot.startTimeCode &&
                timeSlot.timeCode <= slot.endTimeCode
            );

            return {
              time: time,
              timeCode: timeSlot.timeCode.toString(),
              isAvailable: !isSlotBooked,
            };
          }) || [],
    };
  });

  return slotAvailability;
};

export const ScheduleService = {
  createScheduleInDB,
  getScheduleFromDB,
  updateScheduleInDB,
  getAvailableSlots,
};
