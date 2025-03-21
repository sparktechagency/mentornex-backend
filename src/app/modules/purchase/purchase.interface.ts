import { Model, Types } from 'mongoose';

export type IPurchase = {
  mentee_id:Types.ObjectId;
  mentor_id:Types.ObjectId;
  plan_type:'Package' | 'Subscription' | 'PayPerSession';
  amount:number;
  status:"PAID"|"PENDING" | "CANCELLED" | "FAILED" ;
  subscription_cancelled?:boolean;
  date?:Date;
  checkout_session_id:string;
  stripe_subscription_id?:string;
  package_id?:Types.ObjectId;
  subscription_id?:Types.ObjectId;
  pay_per_session_id?:Types.ObjectId;
  stripe_account_id?:string;
  starting_date?:Date;
  ending_date?:Date;
  remaining_sessions?:number;
  is_active?:boolean;
  created_at:Date;
  updated_at:Date;
};

export type PurchaseModel = Model<IPurchase>;
