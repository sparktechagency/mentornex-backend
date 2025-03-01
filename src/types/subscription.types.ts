export type PlanType = 'Subscription' | 'PayPerSession';

export interface PlanDetails {
  sessions: number;
  amount: number;
}
