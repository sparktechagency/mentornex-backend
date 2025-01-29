import { model, Schema } from "mongoose";
import { ISubscription, SubscriptionModal } from "./subscription.interface";

const subscriptionSchema = new Schema<ISubscription, SubscriptionModal>(
    {
      mentee_id: {
        type: String,
        ref: 'User',
        required: true,
      },
      mentor_id: {
        type: String,
        ref: 'User',
        required: true,
      },
      plan_type: {
        type: String,
        enum: ['lite', 'standard', 'pro'],
        required: true,
      },
      start_date: {
        type: Date,
        required: true,
      },
      end_date: {
        type: Date,
        required: true,
      },
      status: {
        type: String,
        enum: ['active', 'cancelled', 'expired'],
        default: 'active',
      },
      stripe_subscription_id: {
        type: String,
        required: true,
      },
      amount: {
        type: Number,
        required: true,
      },
      sessions_remaining: {
        type: Number,
        required: true,
      },
      sessions_per_month: {
        type: Number,
        required: true,
      }
    },
    { timestamps: true }
  );
  
  export const Subscription = model('Subscription', subscriptionSchema);