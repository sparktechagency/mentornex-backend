import { DateTime } from "luxon";
import { ISchedule } from "./schedule.interface.";
import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiError";

export const formatSchedule = (schedule: ISchedule, timeZone: string) => {

    
  // Format the schedule
  const formattedSchedule = schedule.schedule.map(daySchedule => {
    const formattedTimes = daySchedule.times.map((timeString: any) => {

      // Parse the time string in the mentor's time zone
      const localTime = DateTime.fromFormat(timeString, 'h:mm a', { zone: timeZone });
      console.log(localTime)
      // Debug the localTime to see if it's parsed correctly
      if (!localTime.isValid) {
        console.error(`Failed to parse time: ${timeString} with timezone: ${timeZone}`);
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

  return formattedSchedule;
}



export function getNextThreeDates(date?: string) {
  // If no `date` provided, use the current date/time,
  // otherwise parse the given date as dd-MM-yyyy
  const base = date
    ? DateTime.fromFormat(date, "dd-MM-yyyy")
    : DateTime.now();

  // If the base date is invalid, handle it (e.g., throw error)
  if (!base.isValid) {
    throw new Error("Invalid date format. Expect dd-MM-yyyy.");
  }

  // Build an array of three dates, each including date and day
  const nextThreeDates = [];
  for (let i = 0; i < 3; i++) {
    const currentDate = base.plus({ days: i });
    nextThreeDates.push({
      date: currentDate.toFormat("dd-MM-yyyy"),
      day: currentDate.toFormat("cccc"), // e.g. "Saturday", "Sunday"
    });
  }

  return nextThreeDates;
}

export const getTimeCodes = (startTime:Date, endTime:Date, timeZone:string) => {
  const startLocalTime = DateTime.fromJSDate(startTime).setZone(timeZone);
  const endLocalTime = DateTime.fromJSDate(endTime).setZone(timeZone);
  const startUTC = startLocalTime.toUTC();
  const endUTC = endLocalTime.toUTC();
  const startTimeCode = startUTC.hour * 100 + startUTC.minute;
  const endTimeCode = endUTC.hour * 100 + endUTC.minute;
  return { startTimeCode, endTimeCode };
};

export const getDateWiseSlotCount = (schedule: ISchedule, dates: { date: string; day: string }[]) => {
  return dates.map(({ date, day }) => {
    console.log(date, day);
    const daySchedule = schedule.schedule.find(d => d.day.toLowerCase() === day.toLowerCase());
    const slotCount = daySchedule?.times?.length || 0;
    return { date, day, slotCount };
  });
};

  // This function will convert the schedule times based on the user's requested time zone
//  export const convertScheduleToUserTimeZone = (schedule:ISchedule, userTimeZone:string) => {
//     const localTimeZonedData = schedule.schedule.map((day) => {
//         return {
//           ...day,
//           times: day.times.map((slot) => {
//             // Convert the stored time in UTC to the user's requested time zone
//             const localTime = DateTime.fromFormat(slot.time, 'h:mm a', { zone: schedule.timeZone })
//               .toUTC(); // Convert from Asia/Dhaka (UTC+6) to UTC first
    
//             // Now, convert the UTC time to the user's requested time zone
//             const timeInUserTimeZone = localTime.setZone(userTimeZone).toFormat('h:mm a'); // Convert to requested time zone
            
//             return {
//               ...slot,
//               time: timeInUserTimeZone, // Update time with the converted time
//             };
//           }),
//         };
//       });
    
//       return {
//         ...schedule,
//         schedule: localTimeZonedData,
//       };
//   };


export function convertScheduleToLocal(scheduleData:ISchedule, userTimeZone:string) {
    return scheduleData.schedule.map(daySchedule => ({
      ...daySchedule,
      times: daySchedule.times.map(timeSlot => {
        // Parse the UTC time (stored time is in UTC)
        //@ts-ignore
        const [hour, minute] = timeSlot.timeCode.toString().padStart(4, '0').match(/.{1,2}/g);
        
        const utcTime = DateTime.utc().set({
          hour: parseInt(hour),
          minute: parseInt(minute),
          second: 0,
          millisecond: 0
        });
  
        // Convert to user's timezone
        const localTime = utcTime.setZone(userTimeZone);
  
        // Format back to 12-hour time string
        const formattedTime = localTime.toFormat('hh:mm a').toUpperCase();
  
        return {
          ...timeSlot,
          time: formattedTime
        };
      })
    }));
  }