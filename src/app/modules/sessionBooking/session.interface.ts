import { Model, Types} from 'mongoose';
import { PLAN_TYPE } from '../purchase/purchase.interface';

export enum SESSION_STATUS {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  RESCHEDULED = 'rescheduled'
}

export type ISession = {
  _id: Types.ObjectId;
  mentor_id: Types.ObjectId;
  mentee_id: Types.ObjectId;
  scheduled_time: Date;
  session_plan_type: PLAN_TYPE;
  topic: string;
  duration: string;
  cancel_reason?: string;
  pay_per_session_id?: Types.ObjectId;
  package_id?: Types.ObjectId;
  subscription_id?: Types.ObjectId;
  expected_outcome: string;
  status: SESSION_STATUS;
  meeting_token?: string;
  purchased_plan?: Types.ObjectId;
  created_at: Date;
  updated_at: Date;
};

export type SessionModal = Model<ISession>;