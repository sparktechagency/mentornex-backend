import { parse, format } from 'date-fns';
import { getTimezoneOffset, toDate } from 'date-fns-tz';

export const convertTime = (
  time: string,
  fromTimeZone: string,
  toTimeZone: string,
  day: string
): { time: string; day: string } => {
  // Convert time string (e.g., "2:00 PM") to Date object
  const timeDate = parse(time, 'h:mm a', new Date());
  
  // Set the time to the current week's day
  const currentDate = new Date();
  const dayIndex = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(day.toLowerCase());
  timeDate.setDate(currentDate.getDate() - currentDate.getDay() + dayIndex);
  
  // Get timezone offsets in milliseconds
  const sourceOffset = getTimezoneOffset(fromTimeZone, timeDate);
  const targetOffset = getTimezoneOffset(toTimeZone, timeDate);
  
  // Calculate the time difference
  const offsetDiff = targetOffset - sourceOffset;
  
  // Create new date with offset difference
  const targetTime = new Date(timeDate.getTime() + offsetDiff);
  
  // Get the new day and time
  const newDay = format(targetTime, 'EEEE').toLowerCase();
  const newTime = format(targetTime, 'h:mm a');
  
  return { time: newTime, day: newDay };
};
