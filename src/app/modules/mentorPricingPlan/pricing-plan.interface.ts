import { Model, Schema } from 'mongoose';

export type PlanTier = {
  name: string;
  amount: number;
  total_sessions: number;
  stripe_price_id?: string;
};

export type PayPerSession = {
  name: string;
  amount: number;
  duration: string;
  stripe_price_id?: string;
};

export type IPricingPlan = {
  mentor_id: string;
  lite?: PlanTier;
  standard?: PlanTier;
  pro?: PlanTier;
  pay_per_sessions?: PayPerSession[];
};

export type PricingPlanModal = Model<IPricingPlan>;
