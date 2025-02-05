import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { StripeService } from './stripe.service';
import { SubscriptionService } from './subscription.service';
import { PlanType } from '../../../types/subscription.types';
import ApiError from '../../../errors/ApiError';
import { User } from '../user/user.model';
import { PricingPlan } from '../mentorPricingPlan/pricing-plan.model';
import Stripe from 'stripe';
import { PaymentRecord } from '../payment-record/payment-record.model';
import { Subscription } from './subscription.model';
import stripe from '../../../config/stripe';

export const SubscriptionController = {
  createCheckoutSessions: async (req: Request, res: Response) => {
    try {
      const { priceId, amount, planType } = req.body;
      const mentorId = req.params.mentor_id;
      const menteeId = req.user.id;

      // Validate mentee
      const user = await User.findById(menteeId);
      if (!user?.stripeCustomerId) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          'User does not have a Stripe customer ID'
        );
      }

      // Validate mentor and their Stripe connection
      const mentor = await User.findById(mentorId);
      if (!mentor?.stripe_account_id) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          'Mentor does not have a Stripe account'
        );
      }

      // Validate pricing plan exists
      const pricingPlan = await PricingPlan.findOne({
        mentor_id: mentorId,
        'subscriptions.stripe_price_id': priceId,
      });

      if (!pricingPlan) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Pricing plan not found');
      }

      const mentee = await Subscription.find({
        mentee_id: menteeId,
        price_id: priceId,
        status: 'active',
      });
      if (mentee.length > 0) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          'You have already subscribed to this mentor'
        );
      }

      const session = await StripeService.createCheckoutSession(
        user.stripeCustomerId,
        menteeId,
        mentorId,
        priceId,
        planType as PlanType,
        mentor.stripe_account_id,
        amount
      );

      res.json({
        success: true,
        data: { sessionUrl: session.url, sessionId: session.id },
      });
    } catch (error: unknown) {
      console.error('Error creating checkout session:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to create checkout session',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  },
  handleWebhook: async (req: Request, res: Response) => {
    let event;
    try {
      const signature = req.headers['stripe-signature'] as string;
      event = await StripeService.handleWebhook(
        signature,
        req.body,
        process.env.STRIPE_WEBHOOK_SECRET as string
      );
    } catch (err) {
      console.error(' Webhook signature verification failed:', err);
      return res.status(400).json({ success: false });
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;

          // Ensure we have all required metadata
          const { menteeId, mentorId, planType, stripeAccountId, amount } =
            session.metadata || {};

          if (!menteeId || !mentorId || !planType || !stripeAccountId) {
            console.error('Missing required metadata:', session.metadata);
            return res.json({ success: true }); // Still return 200 to acknowledge receipt
          }

          const subscriptionId = session.subscription as string;
          if (!subscriptionId) {
            console.error('No subscription ID found in session');
            return res.json({ success: true });
          }

          // Retrieve subscription details from the connected account
          const subscription = await stripe.subscriptions.retrieve(
            subscriptionId,
            {
              expand: ['items.data.price.product'],
            },
            {
              stripeAccount: stripeAccountId,
            }
          );

          const priceId = subscription.items.data[0]?.price.id;
          if (!priceId) {
            console.error('No price ID found in subscription');
            return res.json({ success: true });
          }

          // Create or update subscription in our database
          const dbSubscription = await SubscriptionService.createSubscription({
            menteeId,
            mentorId,
            priceId,
            planType: planType as PlanType,
            stripePriceId: priceId,
            stripeSubscriptionId: subscriptionId,
          });

          // Create initial payment record if subscription was created successfully
          if (dbSubscription && session.payment_intent) {
            await PaymentRecord.create({
              subscribed_plan_id: dbSubscription.stripe_subscription_id,
              payment_intent_id: session.payment_intent as string,
              mentee_id: menteeId,
              mentor_id: mentorId,
              amount: Number(amount || 0),
              status: 'succeeded',
            });
          }
          break;
        }

        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as Stripe.Invoice;
          const subscriptionId = invoice.subscription as string;

          if (!subscriptionId) {
            console.error('No subscription ID in invoice:', invoice.id);
            return res.json({ success: true });
          }

          // First check if subscription exists
          const existingSubscription = await Subscription.findOne({
            stripe_subscription_id: subscriptionId,
          });

          if (!existingSubscription) {
            console.log(
              'Subscription not found, might be initial payment - skipping update'
            );
            return res.json({ success: true });
          }

          // Update only if subscription exists (renewal payment)
          const subscription =
            await SubscriptionService.updateSubscriptionStatus(
              subscriptionId,
              'active'
            );

          if (subscription && invoice.payment_intent) {
            await PaymentRecord.create({
              subscribed_plan_id: subscription.stripe_subscription_id,
              payment_intent_id: invoice.payment_intent as string,
              mentee_id: existingSubscription.mentee_id,
              mentor_id: existingSubscription.mentor_id,
              amount: invoice.amount_paid / 100,
              status: 'succeeded',
            });
          }
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          await SubscriptionService.updateSubscriptionStatus(
            subscription.id,
            'cancelled'
          );
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          if (invoice.subscription && invoice.payment_intent) {
            const subscription = await Subscription.findOne({
              stripe_subscription_id: invoice.subscription,
            });

            if (subscription) {
              await PaymentRecord.create({
                subscription_id: subscription._id,
                payment_intent_id: invoice.payment_intent as string,
                mentee_id: subscription.mentee_id,
                mentor_id: subscription.mentor_id,
                amount: invoice.amount_due / 100,
                status: 'failed',
              });
            }
          }
          break;
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error processing webhook:', error);
      // Still send 200 response to prevent Stripe from retrying
      res.json({ success: true });
    }
  },
};
