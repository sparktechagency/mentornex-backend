export type PlanType = 'Lite' | 'Standard' | 'Pro';

export interface PlanDetails {
  sessions: number;
  amount: number;
}

export interface PlanStructure {
  lite: PlanDetails;
  standard: PlanDetails;
  pro: PlanDetails;
}
