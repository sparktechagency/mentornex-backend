import { model, Schema } from "mongoose";
import { ISchedule, ScheduleModel } from "./schedule.interface.";

const TimeSlotSchema = new Schema({
  time: {
    type: String,
    required: true,
  },
  timeCode: {
    type: Number,
    required: true,
  },
  status: {
    type: Boolean,
    default: false,
  },
}, { _id: false });

const DayScheduleSchema = new Schema({
  day: {
    type: String,
    required: true,
    enum: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
  },
  times: [TimeSlotSchema],
}, { _id: false });

const ScheduleSchema = new Schema<ISchedule, ScheduleModel>(
  {
    mentor_id: {
      type: String,
      ref: 'User',
      required: true,
    },
    timeZone: {
      type: String,
      required: true,
    },
    schedule: [DayScheduleSchema],
  },
  { timestamps: true }
);

export const Schedule = model<ISchedule, ScheduleModel>('Schedule', ScheduleSchema);