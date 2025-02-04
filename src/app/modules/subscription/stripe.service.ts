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
  accountId: string; // Stripe Connect account ID
}

interface PriceCreateParams {
  productId: string;
  amount: number;
  accountId: string; // Stripe Connect account ID
  recurring?: {
    interval: 'day' | 'week' | 'month' | 'year';
  };
}

export const StripeService = {
  async createConnectAccount(email: string) {
    const account = await stripe.accounts.create({
      type: 'express',
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    const accountLinks = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.FRONTEND_URL}/stripe/refresh`,
      return_url: `${process.env.FRONTEND_URL}/stripe/return`,
      type: 'account_onboarding',
    });

    return { accountId: account.id, onboardingUrl: accountLinks.url };
  },

  async createProduct(params: ProductCreateParams) {
    return await stripe.products.create({
      name: params.title,
      description: params.description,
      metadata: params.metadata,
    }, {
      stripeAccount: params.accountId,
    });
  },

  async createPrice(params: PriceCreateParams) {
    return await stripe.prices.create({
      product: params.productId,
      unit_amount: params.amount * 100,
      currency: 'usd',
      recurring: params.recurring,
    }, {
      stripeAccount: params.accountId,
    });
  },

  async getOrCreateConnectCustomer(globalCustomerId: string, accountId: string) {
    try {
      // First, retrieve the customer from the platform account
      const globalCustomer = await stripe.customers.retrieve(globalCustomerId);
      
      // Check if customer is deleted
      if (globalCustomer.deleted) {
        throw new Error('Customer has been deleted');
      }

      // Now TypeScript knows this is a valid Customer object
      const customerEmail = globalCustomer.email;
      if (!customerEmail) {
        throw new Error('Customer email not found');
      }

      // Search for existing customer on connected account
      const existingCustomers = await stripe.customers.list(
        {
          email: customerEmail,
          limit: 1
        },
        {
          stripeAccount: accountId
        }
      );

      if (existingCustomers.data.length > 0) {
        return existingCustomers.data[0].id;
      }

      // If no existing customer, create a new one on connected account
      const connectCustomer = await stripe.customers.create(
        {
          email: customerEmail,
          name: globalCustomer.name ?? undefined,
          metadata: {
            global_customer_id: globalCustomerId
          }
        },
        {
          stripeAccount: accountId
        }
      );

      return connectCustomer.id;
    } catch (error) {
      console.error('Error in getOrCreateConnectCustomer:', error);
      throw error;
    }
  },

  async verifyPrice(priceId: string, accountId: string) {
    try {
      const price = await stripe.prices.retrieve(priceId, {
        stripeAccount: accountId,
      });
      return price;
    } catch (error) {
      console.error('Error verifying price:', error);
      throw new Error(`Price ${priceId} not found in connected account ${accountId}`);
    }
  },

  async createCheckoutSession(
    stripeCustomerId: string,
    menteeId: string,
    mentorId: string,
    priceId: string,
    planType: PlanType,
    accountId: string,
    amount: number
  ) {
    try {
      // First verify the price exists in the connected account
      await this.verifyPrice(priceId, accountId);

      // Get or create customer on connected account
      const connectCustomerId = await this.getOrCreateConnectCustomer(
        stripeCustomerId,
        accountId
      );

      return await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        customer: connectCustomerId,
        line_items: [{ price: priceId, quantity: 1 }],
        metadata: { menteeId, mentorId, planType, stripeAccountId: accountId, amount },
        success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel`,
        subscription_data: {
          application_fee_percent: 10, // 10% platform fee
        },
      }, {
        stripeAccount: accountId,
      });
    } catch (error) {
      console.error('Error in createCheckoutSession:', error);
      throw error;
    }
  },
  async handleWebhook(
    signature: string,
    payload: Buffer,
    webhookSecret: string
  ) {
    try {
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
      
      return event;
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      throw new Error('Webhook signature verification failed');
    }
  }
};