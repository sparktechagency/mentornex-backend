import { Model } from 'mongoose';
//import { USER_ROLES } from '../../../enums/user';


export type ISession = {
  mentor_id: string;
  mentee_id: string;
  date_time: string;
  topic: string;
  type: string;
  expected_outcome: string;
  fee: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  payment_status: true | false;
};

export type SessionModal = Model<ISession>;