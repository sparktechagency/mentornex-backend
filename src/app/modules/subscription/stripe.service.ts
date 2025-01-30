import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env') });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-12-18.acacia',
});

interface PriceCreateParams {
  amount: number;
  nickname: string;
  recurring?: {
    interval: 'day' | 'week' | 'month' | 'year';
  };
  metadata?: {
    total_sessions?: number;
    duration?: string;
  };
}

export const StripeService = {
  async createPaymentIntent(amount: number, menteeId: string, mentorId: string, sessionId: string) {
    return await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency: 'usd',
      customer: menteeId,
      metadata: { sessionId, mentorId },
      capture_method: 'manual', // For holding the payment
    });
  },
  async createPrice(params: PriceCreateParams) {
    return await stripe.prices.create({
      unit_amount: params.amount * 100, // Convert to cents
      currency: 'usd',
      product_data: {
        name: params.nickname,
      },
      nickname: params.nickname,
      recurring: params.recurring,
      metadata: params.metadata,
    });
  },
  async capturePayment(paymentIntentId: string) {
    return await stripe.paymentIntents.capture(paymentIntentId);
  },

  async createSubscription(menteeId: string, mentorId: string, priceId: string) {
    return await stripe.subscriptions.create({
      customer: menteeId,
      metadata: { mentorId },
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
    });
  },

  async refundPayment(paymentIntentId: string) {
    return await stripe.refunds.create({
      payment_intent: paymentIntentId,
    });
  },
};