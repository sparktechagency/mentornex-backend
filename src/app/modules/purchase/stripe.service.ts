import Stripe from 'stripe';
import stripe from '../../../config/stripe';

import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { IPlanType } from '../../../types/plan';



interface ProductCreateParams {
  title: string;
  description?: string;
  metadata?: {
    sessions?: number;
    duration?: number;
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
    planType: IPlanType;
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

  async updateProduct(params: {productId: string, title: string, description?: string, metadata?: {sessions?: number;}, accountId: string}) {
    return await stripe.products.update(params.productId, {
      name: params.title,
      description: params.description,
      metadata: params.metadata,
    }, {
      stripeAccount: params.accountId,
    });


  },

  async removePrice(priceId: string, accountId: string) {
    return await stripe.prices.update(
      priceId,
      { active: false },
      { stripeAccount: accountId }
    );
  },
  
  async deactivateAllPricesForProduct(productId: string, accountId: string) {
    // Retrieve all prices associated with the product
    const prices = await stripe.prices.list(
      {
        product: productId,
        // active: true, // Only deactivate active prices
      },
      // { stripeAccount: accountId }
    );
  
    console.log('Prices to deactivate: 🦥🦥🦥🦥🦥🦥🦥', prices.data);
    // Deactivate all prices
    const deactivatePromises = prices.data.map((price) =>
      this.removePrice(price.id, accountId)
    );
  
    await Promise.all(deactivatePromises);
  },

  async deleteProduct(productId: string, accountId: string) {
    return await stripe.products.del(productId, {
      stripeAccount: accountId,
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


  async createInvoice(params: {customerId: string, amount: number,accountId: string, metadata: { purchaseId: string, checkout_session_id: string, planType: IPlanType}}) {
    return await stripe.invoices.create({
      customer: params.customerId,
      description:`Thank you for purchasing the ${params.metadata.planType} plan`,
      application_fee_amount: Math.round(Number(params.amount) * 0.1),
      metadata: params.metadata,
      footer: 'Thank you for using Mentornex!'
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


  async cancelSubscription(subscriptionId: string) {
    return await stripe.subscriptions.cancel(subscriptionId);
  },

  async getOrCreateConnectCustomer(customerId: string, accountId: string) {
    try {
      // First, retrieve the customer from the platform account
      const globalCustomer = await stripe.customers.retrieve(customerId);
      
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
            global_customer_id: customerId
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
    customerId: string,
    menteeId: string,
    mentorId: string,
    title: string,
    planType: 'Subscription' | 'PayPerSession' | 'Package',
    accountId: string,
    amount: number,
    priceId?: string,
  ) {
    try {
      // Get or create customer on connected account
      const connectCustomerId = await this.getOrCreateConnectCustomer(customerId, accountId);

      
      if (planType === 'Subscription' && !priceId) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'priceId required for subscriptions');
      }
      // Validate price for non-subscription plans
      if (planType === 'Subscription' && priceId) {
        await this.verifyPrice(priceId, accountId);
      }
  
      // Determine mode and line items based on plan type
      const isSubscription = planType === 'Subscription';
      const isPayPerSession = planType === 'PayPerSession';
      const isPackage = planType === 'Package';
      const mode = isSubscription ? 'subscription' : 'payment';
  
      const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = isSubscription
        ? [{ price: priceId, quantity: 1 }]
        : [
            {
              price_data: {
                currency: 'usd',
                product_data: { name: title },
                unit_amount: Number((amount * 100).toFixed(2)), // Convert to cents
              },
              quantity: 1,
            },
          ];
  
      // Create the checkout session
      const session =  await stripe.checkout.sessions.create(
        {
          payment_method_types: ['card'],
          mode,
          customer: connectCustomerId,
          line_items,
          success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
          ...(isSubscription && {
            subscription_data: {
              application_fee_percent: 10, // Deducts 10% fee for subscriptions
            },
          }),
          ...(isPackage && {
            payment_intent_data: {
              application_fee_amount: Math.round(amount * 0.1), // Deducts 10% fee for packages
            },
          }),
          metadata: {
            mentee_id: menteeId,
            mentor_id: mentorId,
            plan_type: planType,
            stripe_account_id: accountId,
            amount,
          },
        },
        {
          stripeAccount: accountId,
        }
      );

      return { sessionId: session.id , url: session.url as string};
    } catch (error) {
      console.error('Error in createCheckoutSession:', error);
      //@ts-ignore
      throw new Error(`Failed to create checkout session: ${error.message}`);
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