import { DateTime } from 'luxon';

export const convertDate = (date: string, slot: string, timeZone: string) => {
    return DateTime.fromFormat(`${date} ${slot}`, 'MM/dd/yyyy h:mm a', { zone: timeZone }).toUTC().toISO();
}