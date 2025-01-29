import { Model, Schema } from 'mongoose';
//import { USER_ROLES } from '../../../enums/user';


export type ISession = {
  mentor_id: string;
  mentee_id: string;
  date_time: Date;
  session_type: string;
  topic: string;
  duration: string;
  expected_outcome: string;
  fee: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  payment_type: 'subscription' | 'per_session';
  stripe_payment_intent_id: string;
  payment_status: 'pending'| 'held'| 'released'| 'refunded';
  amount: number;
  platform_fee: number;
  subscription_id: Schema.Types.ObjectId;
};

export type SessionModal = Model<ISession>;