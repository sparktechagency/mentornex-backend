import { Model } from 'mongoose';

export type TimeSlot = {
  time: string;
  status: boolean;
};

export type DaySchedule = {
  day: string;
  times: TimeSlot[];
};

export type ISchedule = {
  mentor_id: string;
  schedule: DaySchedule[];
};

export type ScheduleModel = Model<ISchedule>;