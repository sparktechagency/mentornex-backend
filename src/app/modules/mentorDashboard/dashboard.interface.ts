import { Model } from 'mongoose';

export type MonthlySessionData = {
  month: string;
  payPerSession: number;
  package: number;
};

export type MonthlyEarningData = {
  month: string;
  payPerSession: number;
  package: number;
  subscription: number;
  total: number;
};

export type SessionRateResponse = {
  data: MonthlySessionData[];
  totalPayPerSession: number;
  totalPackage: number;
  totalSessions: number;
};

export type EarningResponse = {
  data: MonthlyEarningData[];
  totalPayPerSession: number;
  totalPackage: number;
  totalSubscription: number;
  totalEarnings: number;
};

export type DashboardModel = Model<{}>;