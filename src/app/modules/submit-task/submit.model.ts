import { model, Schema } from 'mongoose';
import { ISubmit, SubmitModel } from './submit.interface';

const submitSchema = new Schema<ISubmit, SubmitModel>(
  {
    taskId: {
      type: String,
      required: true,
    },
    menteeId: {
      type: String,
      ref: 'User',
      required: true,
    },
    answer: {
      type: String
    },
    file: {
      type: String
    },
    status: {
      type: String,
      enum: ['reviewed', 'pending'],
      default: 'pending'
    },
    feedback: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const Submit = model<ISubmit, SubmitModel>('Submit', submitSchema);