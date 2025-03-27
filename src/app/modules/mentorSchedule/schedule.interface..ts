import { Model, Types } from 'mongoose';

export type TimeSlot = {
  time: string;
  timeCode: number;
  status: boolean;
};

export type DaySchedule = {
  day: string;
  times: TimeSlot[];
};

export type ISchedule = {
  mentor_id: Types.ObjectId;
  timeZone: string;
  schedule: DaySchedule[];
};

export type ScheduleModel = Model<ISchedule>;