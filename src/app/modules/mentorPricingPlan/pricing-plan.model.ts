import { model, Schema } from 'mongoose';
import { IPricingPlan, PricingPlanModal } from './pricing-plan.interface';

const planTierSchema = new Schema({
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  total_sessions: { type: Number, required: true },
  stripe_price_id: { type: String, required: true }
});

const payPerSessionSchema = new Schema({
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  duration: { type: String, required: true },
  stripe_price_id: { type: String, required: true }
});

const pricingPlanSchema = new Schema<IPricingPlan, PricingPlanModal>(
  {
    mentor_id: {
      type: String,
      ref: 'User',
      required: true,
      unique: true
    },
    lite: planTierSchema,
    standard: planTierSchema,
    pro: planTierSchema,
    pay_per_session: payPerSessionSchema
  },
  {
    timestamps: true
  }
);

export const PricingPlan = model<IPricingPlan>('PricingPlan', pricingPlanSchema);
