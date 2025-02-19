import { model, Schema } from 'mongoose';
import { ISession, SessionModal } from './session.interface';

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
    scheduled_time: {
      type: Date,
      required: true,
    },
    session_type: {
      type: String,
      required: true,
    },
    topic: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
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
      enum: ['pending', 'accepted', 'cancelled', 'completed'],
      default: 'pending',
    },
    payment_type: {
      type: String,
      enum: ['subscription', 'per_session'],
      required: true,
    },
    stripe_payment_intent_id: {
      type: String,
    },
    payment_status: {
      type: String,
      enum: ['pending', 'held', 'released', 'refunded', 'cancelled'],
      default: 'pending',
    },
    amount: {
      type: Number,
      required: true,
    },
    platform_fee: {
      type: Number,
      required: true,
    },
    meeting_id: {
      type: String
    },
    meeting_url: {
      type: String
    }
  },
  { timestamps: true }
);

export const Session = model<ISession, SessionModal>('Session', sessionSchema);
