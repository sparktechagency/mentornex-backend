import { Model} from 'mongoose';

export type Subscription = {
  title: string;
  amount: number;
  total_sessions: number;
  stripe_product_id: string;
  stripe_price_id: string;
  description?: string;
};

export type PayPerSession = {
  title: string;
  amount: number;
  duration: string;
  stripe_product_id: string;
  stripe_price_id: string;
  description?: string;
};

export type IPricingPlan = {
  mentor_id: string;
  stripe_account_id: string;
  subscriptions?: Subscription[];
  pay_per_sessions?: PayPerSession[];
};

export type PricingPlanModal = Model<IPricingPlan>;