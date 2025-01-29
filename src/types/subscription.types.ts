export type PlanType = 'lite' | 'standard' | 'pro';

export interface PlanDetails {
  sessions: number;
  amount: number;
}

export interface PlanStructure {
  lite: PlanDetails;
  standard: PlanDetails;
  pro: PlanDetails;
}