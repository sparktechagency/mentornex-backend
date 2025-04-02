import { DateTime } from "luxon"

export const convertSlotTimeToUTC = (slot: string, timeZone: string) => {
    const localTime = DateTime.fromFormat(slot, 'h:mm a', { zone: timeZone });
    const utcTime = localTime.toUTC();

    const timeCode = utcTime.hour * 100 + utcTime.minute;

    return {timeCode, time: utcTime.toFormat('h:mm a')};
}




export const convertSessionTimeToUTC = (slot: string, timeZone: string, referenceDate?: string) => {
    // Combine with reference date if provided
    const dateTimeString = referenceDate ? `${referenceDate} ${slot}` : slot;
    
    const localTime = DateTime.fromFormat(dateTimeString, 'yyyy-MM-dd h:mm a', { zone: timeZone });
    if (!localTime.isValid) {
        throw new Error(`Invalid time format: ${slot} for timezone ${timeZone}`);
    }

    const utcTime = localTime.toUTC();
    return {
        timeCode: utcTime.hour * 100 + utcTime.minute,
        time: utcTime.toFormat('h:mm a'),
        isoString: utcTime.toISO() // Return full ISO string
    };
};


export const calculateEndTime = (startTime: Date, durationMinutes: number): Date => {
    // Create new Date object to avoid modifying the original
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + durationMinutes);
    return endTime;
  };

export const convertSessionTimeToLocal = (time: Date, timeZone: string) => {
      // 1. Get the UTC time from MongoDB
      const utcTime = DateTime.fromJSDate(time).toUTC();
            
      // 2. Convert to user's timezone
      const userLocalTime = utcTime.setZone(timeZone);
      
      // 3. Format for display
      return userLocalTime.toFormat('yyyy-MM-dd h:mm a');
}

export const convertSlotTimeToLocal = (slot: string, timeZone: string) => {
  
    //@ts-ignore
    const [hour, minute] = slot.toString().padStart(4, '0').match(/.{1,2}/g);
    const utcTime = DateTime.utc().set({
      hour: parseInt(hour),
      minute: parseInt(minute),
      second: 0,
      millisecond: 0
    });

    // Convert to user's timezone
    const localTime = utcTime.setZone(timeZone);

    // Format back to 12-hour time string
    const formattedTime = localTime.toFormat('hh:mm a').toUpperCase();

    const timeCode = localTime.hour * 100 + localTime.minute;

    return {timeCode, time: formattedTime};
}

