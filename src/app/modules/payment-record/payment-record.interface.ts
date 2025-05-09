import { Model, Types } from 'mongoose';
import { PLAN_TYPE } from '../purchase/purchase.interface';

export type IPaymentRecord = {
  _id?: Types.ObjectId;
  subscription_id?: Types.ObjectId;
  package_id?: Types.ObjectId;
  pay_per_session_id?: Types.ObjectId;
  checkout_session_id: string;
  mentee_id: Types.ObjectId;
  mentor_id: Types.ObjectId;
  invoice_id?: string;
  amount: number;
  type: PLAN_TYPE;
  application_fee: number;
};

export type PaymentRecordModel = Model<IPaymentRecord>;
