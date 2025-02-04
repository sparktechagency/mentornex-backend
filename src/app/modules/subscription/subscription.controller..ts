import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { stripe, StripeService } from './stripe.service';
import { SubscriptionService } from './subscription.service';
import { PlanType } from '../../../types/subscription.types';
import ApiError from '../../../errors/ApiError';
import { User } from '../user/user.model';
import { PricingPlan } from '../mentorPricingPlan/pricing-plan.model';
import Stripe from 'stripe';

export const SubscriptionController = {
  createCheckoutSession: async (req: Request, res: Response) => {
    try {
      const { priceId, amount, planType } = req.body;
      const mentorId = req.params.mentor_id;
      const menteeId = req.user.id;

      // Validate mentee
      const user = await User.findById(menteeId);
      if (!user?.stripeCustomerId) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'User does not have a Stripe customer ID');
      }

      // Validate mentor and their Stripe connection
      const mentor = await User.findById(mentorId);
      if (!mentor?.stripe_account_id) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Mentor does not have a Stripe account');
      }

      // Validate pricing plan exists
      const pricingPlan = await PricingPlan.findOne({ 
        mentor_id: mentorId,
        'subscriptions.stripe_price_id': priceId 
      });
      
      if (!pricingPlan) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Pricing plan not found');
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
      console.error("Error creating checkout session:", error);
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
      console.error('⚠️ Webhook signature verification failed:', err);
      return res.status(400).json({ success: false });
    }
  
    try {
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Ensure we have all required metadata
        const menteeId = session.metadata?.menteeId;
        const mentorId = session.metadata?.mentorId;
        const planType = session.metadata?.planType as PlanType;
        const connectedAccountId = session.metadata?.stripeAccountId;
  
        if (!menteeId || !mentorId || !planType || !connectedAccountId) {
          throw new Error('Missing required metadata in session');
        }
  
        // Get the subscription ID from the session
        const subscriptionId = session.subscription as string;
        if (!subscriptionId) {
          throw new Error('No subscription ID found in session');
        }
  
        // Retrieve subscription details from the connected account
        const subscription = await stripe.subscriptions.retrieve(
          subscriptionId,
          {
            expand: ['items.data.price.product']
          }
        );
  
        // Get the price ID from the subscription
        const priceId = subscription.items.data[0]?.price.id;
        if (!priceId) {
          throw new Error('No price ID found in subscription');
        }
  
        // Create subscription in our database
        const newSubscription = await SubscriptionService.createSubscription({
          menteeId,
          mentorId,
          planType,
          stripePriceId: priceId,
          stripeSubscriptionId: subscriptionId
        });

        await newSubscription.save();
  
        console.log('Successfully created subscription:', {
          subscriptionId: newSubscription._id,
          stripeSubscriptionId: subscriptionId,
          menteeId,
          mentorId,
          planType
        });
      }
  
      // Handle subscription cancellation
      if (event.type === 'customer.subscription.deleted') {
        const subscription = event.data.object as Stripe.Subscription;
        await SubscriptionService.updateSubscriptionStatus(
          subscription.id,
          'cancelled'
        );
        console.log(`Successfully cancelled subscription ${subscription.id}`);
      }
  
      // Handle invoice payment success (for subscription renewals)
      if (event.type === 'invoice.payment_succeeded') {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          await SubscriptionService.updateSubscriptionStatus(
            invoice.subscription as string,
            'active'
          );
          console.log(`Successfully renewed subscription ${invoice.subscription}`);
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