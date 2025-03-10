import { Model, Schema } from "mongoose";

export type PlanType = 'Subscription' | 'PayPerSession';
export interface CreateCheckoutSessionDto {
  priceId: string;
  productId: string;
  planType: PlanType;
}



export interface PlanDetails {
  sessions: number;
  amount: number;
}


export type ISubscription = {
  mentee_id: string;
  mentor_id: string;
  price_id: string;
  plan_type: PlanType;
  start_date: Date;
  end_date: Date;
  status: 'active' | 'cancelled' | 'expired';
  stripe_subscription_id: string;
  stripe_connected_account_id: string;
  stripe_connected_customer_id: string;
  amount: number;
  sessions_remaining: number;
  sessions_per_month: number;
}

export type SubscriptionModal = Model<ISubscription>;
