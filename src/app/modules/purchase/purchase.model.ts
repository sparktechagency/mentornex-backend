import { Schema, model } from 'mongoose';
import { IPurchase, PurchaseModel } from './purchase.interface'; 

const purchaseSchema = new Schema<IPurchase, PurchaseModel>({
  mentee_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  mentor_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  plan_type: {
    type: String,
    enum: ['Package', 'Subscription', 'PayPerSession'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  is_active: {
    type: Boolean,
    default: false,
  },
  subscription_cancelled: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['PAID', 'PENDING', 'CANCELLED', 'FAILED' ],
    default: 'PENDING',
  },
  checkout_session_id: {
    type: String,
    required: true,
  },
  stripe_subscription_id: {
    type: String,
  },
  package_id: {
    type: Schema.Types.ObjectId,
    ref: 'Package',
  },
  subscription_id: {
    type: Schema.Types.ObjectId,
    ref: 'Subscription',
  },
  pay_per_session_id: {
    type: Schema.Types.ObjectId,
    ref: 'PayPerSession',
  },
  remaining_sessions: {
    type: Number,
  },
  stripe_account_id: {
    type: String,

  },
  
  starting_date: {
    type: Date,
  },
  ending_date: {
    type: Date,
  },
  
}, { timestamps: true });

export const Purchase = model<IPurchase, PurchaseModel>('Purchase', purchaseSchema);
