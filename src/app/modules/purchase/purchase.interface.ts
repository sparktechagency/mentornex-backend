import { Model, Types } from 'mongoose';

export enum PLAN_TYPE {
  Package = 'Package',
  Subscription = 'Subscription',
  PayPerSession = 'PayPerSession'
}

export enum PURCHASE_PLAN_STATUS {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED'
}

export enum PAYMENT_STATUS {
  PAID = 'PAID',
  PENDING = 'PENDING',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED'
}

export type IPurchase = {
  mentee_id:Types.ObjectId;
  mentor_id:Types.ObjectId;
  plan_type:PLAN_TYPE;
  amount:number;
  application_fee:number;
  status:PAYMENT_STATUS;
  plan_status:PURCHASE_PLAN_STATUS;
  subscription_cancelled?:boolean;
  checkout_session_id:string;
  stripe_subscription_id?:string;
  package_id?:Types.ObjectId;
  subscription_id?:Types.ObjectId;
  pay_per_session_id?:Types.ObjectId;
  stripe_account_id?:string;
  starting_date?:Date;
  ending_date?:Date;
  is_active?:boolean;
  created_at:Date;
  updated_at:Date;
};

export type PurchaseModel = Model<IPurchase>;
