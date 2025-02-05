import { Model } from "mongoose";

export interface IPaymentRecord {
    subscribed_plan_id: string;
    payment_intent_id: string;
    amount: number;
    status: 'succeeded' | 'failed';
    created_at: Date;
  }
  
  export type PaymentRecordModel = Model<IPaymentRecord>;