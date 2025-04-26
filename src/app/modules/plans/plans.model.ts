import { Schema, model } from 'mongoose';
import {
  IPayPerSession,
  IPackage,
  ISubscription,
  IPayPerSessionModel,
  IPackageModel,
  ISubscriptionModel,
  PLAN_STATUS,
} from './plans.interface';

const payPerSessionSchema = new Schema<IPayPerSession, IPayPerSessionModel>(
  {
    mentor_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    duration: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    features: {
      type: [String],
    },
    status: {
      type: String,
      enum: [PLAN_STATUS.ACTIVE, PLAN_STATUS.INACTIVE],
      default: PLAN_STATUS.ACTIVE,
    },
  },
  { timestamps: true }
);

const packageSchema = new Schema<IPackage, IPackageModel>(
  {
    mentor_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    sessions: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
    },
    features: {
      type: [String],
    },
    status: {
      type: String,
      enum: [PLAN_STATUS.ACTIVE, PLAN_STATUS.INACTIVE],
      default: PLAN_STATUS.ACTIVE,
    },
  },
  { timestamps: true }
);

const subscriptionSchema = new Schema<ISubscription, ISubscriptionModel>({
  mentor_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },

  stripe_product_id: {
    type: String,
    required: true,
  },
  stripe_price_id: {
    type: String,
    required: true,
  },
  stripe_account_id: {
    type: String,
    required: true,
  },
  payment_link: {
    type: String,
  },
  description: {
    type: String,
  },
  features: {
    type: [String],
    required: true,
  },
  status: {
    type: String,
    enum: [PLAN_STATUS.ACTIVE, PLAN_STATUS.INACTIVE],
    default: PLAN_STATUS.ACTIVE,
  },
  type: {
    type: String,
    default: 'content',
    required: true,
  },
});

export const PayPerSession = model<IPayPerSession, IPayPerSessionModel>(
  'PayPerSession',
  payPerSessionSchema
);
export const Package = model<IPackage, IPackageModel>('Package', packageSchema);
export const Subscription = model<ISubscription, ISubscriptionModel>(
  'Subscription',
  subscriptionSchema
);
