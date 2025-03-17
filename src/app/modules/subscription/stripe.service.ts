import Stripe from 'stripe';
import stripe from '../../../config/stripe';
import { PlanType } from './subscription.interface';



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

interface PaymentLinkCreateParams {
  priceId: string;
  accountId: string;
  metadata: {
    mentorId: string;
    planType: PlanType;
    [key: string]: string | number;
    accountId: string;
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

  async createPaymentLink(params: PaymentLinkCreateParams) {
    const isSubscription = params.metadata.planType === 'Subscription';
    const amount = Number(params.metadata.amount);

    // Base configuration for both types
    const paymentLinkConfig: Stripe.PaymentLinkCreateParams = {
      line_items: [
        {
          price: params.priceId,
          quantity: 1,
        },
      ],
      after_completion: {
        type: 'redirect',
        redirect: {
          url: `${process.env.FRONTEND_URL}/subscription/success?payment_link={CHECKOUT_SESSION_ID}`,
        },
      },
      metadata: params.metadata,
    };

    // Add fee configuration based on plan type
    if (isSubscription) {
      // For subscriptions, use application_fee_percent
      paymentLinkConfig.application_fee_percent = 10;
    } else {
      // For one-time payments, use application_fee_amount
      // Calculate 10% of the amount in cents
      paymentLinkConfig.application_fee_amount = Math.round(amount * 10); // 10% in cents
    }

    const paymentLink = await stripe.paymentLinks.create(
      paymentLinkConfig,
      {
        stripeAccount: params.accountId,
      }
    );

    return paymentLink;
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

      // Configuration based on plan type
      const isSubscription = planType === 'Subscription';
      
      return await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: isSubscription ? 'subscription' : 'payment',
        customer: connectCustomerId,
        line_items: [{ price: priceId, quantity: 1 }],
        metadata: { menteeId, mentorId, planType, stripeAccountId: accountId, amount },
        success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel`,
        ...(isSubscription && {
          subscription_data: {
            application_fee_percent: 10, // 10% platform fee
          },
        }),
        ...((!isSubscription) && {
          payment_intent_data: {
            application_fee_amount: Math.round(amount * 100 * 0.1), // 10% platform fee
          },
        }),
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