import { model, Schema } from 'mongoose';
import { IPaymentRecord, PaymentRecordModel } from './payment-record.interface';
import { PLAN_TYPE } from '../purchase/purchase.interface';

const paymentRecordSchema = new Schema<IPaymentRecord, PaymentRecordModel>(
  {
    mentee_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    mentor_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    package_id: {
      type: Schema.Types.ObjectId,
      ref: 'Package',

    },
    invoice_id: {
      type: String,
      
    },
    subscription_id: {
      type: Schema.Types.ObjectId,
      ref: 'Subscription',

    },
    pay_per_session_id: {
      type: Schema.Types.ObjectId,
      ref: 'PayPerSession',

    },
    amount: {
      type: Number,
      required: true,
    },
    application_fee: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: [PLAN_TYPE.Package, PLAN_TYPE.Subscription, PLAN_TYPE.PayPerSession],
      required: true,
    },
  },
  { timestamps: true }
);

export const PaymentRecord = model<IPaymentRecord>(
  'PaymentRecord',
  paymentRecordSchema
);
