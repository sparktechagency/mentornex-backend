import { model, Schema } from "mongoose";
import { IPaymentRecord, PaymentRecordModel } from "./payment-record.interface";

const paymentRecordSchema = new Schema<IPaymentRecord, PaymentRecordModel>(
  {
    subscribed_plan_id: {
      type: String,
      ref: 'Subscription',
      required: true,
      index: true
    },
    payment_intent_id: {
      type: String,
      required: true,
      unique: true
    },
    amount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['succeeded', 'failed'],
      required: true
    },
    created_at: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

export const PaymentRecord = model<IPaymentRecord>('PaymentRecord', paymentRecordSchema);