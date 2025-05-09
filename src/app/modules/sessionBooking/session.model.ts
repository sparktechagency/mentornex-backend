import { model, Schema } from 'mongoose';
import { ISession, SESSION_STATUS, SessionModal } from './session.interface';
import { PLAN_TYPE } from '../purchase/purchase.interface';

const sessionSchema = new Schema<ISession, SessionModal>(
  {
    mentor_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    mentee_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    scheduled_time: {
      type: Date,
      required: true,
    },
    end_time: {
      type: Date,
      required: true,
    },
    session_plan_type: {
      type: String,
      enum: [
        PLAN_TYPE.Package,
        PLAN_TYPE.Subscription,
        PLAN_TYPE.PayPerSession,
      ],
      required: true,
    },
    pay_per_session_id: { type: Schema.Types.ObjectId, ref: 'PayPerSession' },
    package_id: { type: Schema.Types.ObjectId, ref: 'Package' },
    subscription_id: { type: Schema.Types.ObjectId, ref: 'Subscription' },
    cancel_reason: { type: String },
    topic: {
      type: String,
      // required: true,
    },
    payment_required: { type: Boolean, default: true },
    duration: {
      type: String,
      required: true,
    },
    expected_outcome: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: [
        SESSION_STATUS.PENDING,
        SESSION_STATUS.ACCEPTED,
        SESSION_STATUS.COMPLETED,
        SESSION_STATUS.CANCELLED,
      ],
      default: SESSION_STATUS.PENDING,
    },
    meeting_token: {
      type: String,
    },
    purchased_plan: {
      type: Schema.Types.ObjectId,
      ref: 'Purchase',
    },
  },
  { timestamps: true }
);

export const Session = model<ISession, SessionModal>('Session', sessionSchema);
