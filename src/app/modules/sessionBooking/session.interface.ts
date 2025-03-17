import { Model, Types} from 'mongoose';

export type ISession = {
  mentor_id: Types.ObjectId;
  mentee_id: Types.ObjectId;
  scheduled_time: Date;
  session_type: string;
  topic: string;
  duration: string;
  expected_outcome: string;
  fee: string;
  status: 'pending' | 'accepted' | 'cancelled' | 'completed';
  payment_type: 'subscription' | 'per_session';
  stripe_payment_intent_id: string;
  payment_status: 'pending'| 'held'| 'released'| 'refunded' | 'cancelled' | 'failed';
  amount: number;
  platform_fee: number;
  meeting_id?: string;
  meeting_url?: string;
  //host_token?: string;
  //participant_token?: string;
};

export type SessionModal = Model<ISession>;