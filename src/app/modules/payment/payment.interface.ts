export interface IPayment {
    sessionId: string;
    userId: string;
    amount: number;
    status: 'pending' | 'completed' | 'failed';
    stripeSessionId: string;
  }