import { Model, Types } from "mongoose";

export type IPaymentRecord = {
    subscribed_plan_id: string;
    payment_intent_id: string;
    mentee_id: Types.ObjectId;
    mentor_id: Types.ObjectId;
    amount: number;
    status: 'succeeded' | 'failed';
    created_at: Date;
  }
  
  export type PaymentRecordModel = Model<IPaymentRecord>;