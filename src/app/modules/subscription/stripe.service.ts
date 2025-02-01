import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';
import { PlanType } from '../../../types/subscription.types';
dotenv.config({ path: path.join(process.cwd(), '.env') });

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-12-18.acacia',
});

interface ProductCreateParams {
  title: string;
  description?: string;
  metadata?: {
    total_sessions?: number;
    duration?: string;
  };
}

interface PriceCreateParams {
  productId: string;
  amount: number;
  recurring?: {
    interval: 'day' | 'week' | 'month' | 'year';
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
  async createProduct(params: ProductCreateParams) {
    return await stripe.products.create({
      name: params.title,
      description: params.description,
      metadata: params.metadata,
    });
  },

  async createPrice(params: PriceCreateParams) {
    return await stripe.prices.create({
      product: params.productId,
      unit_amount: params.amount * 100, // Convert to cents
      currency: 'usd',
      recurring: params.recurring,
    });
  },
  async capturePayment(paymentIntentId: string) {
    return await stripe.paymentIntents.capture(paymentIntentId);
  },

  async refundPayment(paymentIntentId: string) {
    return await stripe.refunds.create({
      payment_intent: paymentIntentId,
    });
  },

  async createCheckoutSession(
    stripeCustomerId: string,
    menteeId: string,
    mentorId: string,
    priceId: string,
    planType: PlanType,
    successUrl: string,
    cancelUrl: string
  ) {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        menteeId, // Store actual menteeId in metadata
        mentorId,
        planType,
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return session;
  },

  async createSubscription(
    stripeCustomerId: string,
    mentorId: string,
    priceId: string
  ) {
    return await stripe.subscriptions.create({
      customer: stripeCustomerId,
      metadata: { mentorId },
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
    });
  },

  async handleWebhook(
    signature: string,
    payload: Buffer,
    webhookSecret: string
  ) {
    try {
      console.log("Webhook received - Verifying signature...");
      console.log("Webhook Secret available:", !!webhookSecret);
      console.log("Signature received:", !!signature);
      
      if (!webhookSecret) {
        throw new Error('Webhook secret is not configured');
      }
      
      if (!signature) {
        throw new Error('No signature found in request');
      }
  
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );
      
      console.log("Webhook signature verified successfully");
      return event;
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      throw new Error('Webhook signature verification failed');
    }
  }
};