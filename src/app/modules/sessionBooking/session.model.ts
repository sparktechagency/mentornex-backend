import { model, Schema } from "mongoose";
import { ISession, SessionModal } from "./session.interface";


const sessionSchema = new Schema<ISession, SessionModal>(
    {
      mentor_id: {
        type: String,
        ref: 'User',
        required: true,
      },
      mentee_id: {
        type: String,
        ref: 'User',
        required: true,
      },
      date_time: {
        type: String,
        required: true
      },
      topic: {
        type: String,
        required: true
      },
      type: {
        type: String,
        required: true
      },
      expected_outcome: {
        type: String,
        required: true,
      },
      fee: {
        type: String,
      },
      status: {
        type: String,
        enum: ['pending', 'accepted' , 'rejected', 'completed'],
        default: 'pending',
      },
      payment_status: {
        type: Boolean,
        default: false
      }
    },
    { timestamps: true }
  );

export const Session = model<ISession, SessionModal>('Session', sessionSchema);