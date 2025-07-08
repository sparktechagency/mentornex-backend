import { model, Schema } from 'mongoose';
import { IPricingPlan, PricingPlanModal } from './pricing-plan.interface';

const subscriptionSchema = new Schema({
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  total_sessions: { type: Number, required: true },
  stripe_product_id: { type: String, required: true },
  stripe_price_id: { type: String, required: true },
  payment_link: { type: String, required: true },
  description: { type: String },
});

const payPerSessionSchema = new Schema({
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  duration: { type: String, required: true },
  stripe_product_id: { type: String, required: true },
  stripe_price_id: { type: String, required: true },
  payment_link: { type: String, required: true },
  description: { type: String },
});

const pricingPlanSchema = new Schema<IPricingPlan, PricingPlanModal>(
  {
    mentor_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    stripeCustomerId: {
      type: String,
      required: true,
    },
    features:{
      type:[String],
      required:true
    },
    subscriptions: subscriptionSchema,
    pay_per_sessions: [payPerSessionSchema],
  },
  {
    timestamps: true,
  }
);

export const PricingPlan = model<IPricingPlan>('PricingPlan', pricingPlanSchema);