import { Model, Schema } from "mongoose";
import { PlanType } from "../../../types/subscription.types";

export interface CreateCheckoutSessionDto {
  priceId: string;
  productId: string;
  planType: PlanType;
}

export type ISubscription = {
  mentee_id: string;
  mentor_id: string;
  plan_type: PlanType;
  start_date: Date;
  end_date: Date;
  status: 'active' | 'cancelled' | 'expired';
  stripe_subscription_id: string;
  amount: number;
  sessions_remaining: number;
  sessions_per_month: number;
}

export type SubscriptionModal = Model<ISubscription>;
