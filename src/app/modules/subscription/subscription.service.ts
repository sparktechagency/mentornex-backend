import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { Subscription } from './subscription.model';
import { PlanType } from '../../../types/subscription.types';
import { PricingPlan } from '../mentorPricingPlan/pricing-plan.model';

interface CreateSubscriptionParams {
  menteeId: string;
  mentorId: string;
  priceId: string;
  planType: PlanType;
  stripePriceId: string;
  stripeSubscriptionId: string;
}

export const SubscriptionService = {
  async createSubscription(params: CreateSubscriptionParams) {
    try {
      // Check if subscription already exists
      const existingSubscription = await Subscription.findOne({
        stripe_subscription_id: params.stripeSubscriptionId
      });
  
      if (existingSubscription) {
        console.log('Subscription already exists:', params.stripeSubscriptionId);
        return existingSubscription;
      }
  
      // Get pricing plan details
      const pricingPlan = await PricingPlan.findOne({ 
        mentor_id: params.mentorId,
        'subscriptions.stripe_price_id': params.stripePriceId 
      });
  
      if (!pricingPlan?.subscriptions) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Pricing plan not found');
      }
  
      const subscriptionPlan = pricingPlan.subscriptions.find(
        sub => sub.stripe_price_id === params.stripePriceId
      );
  
      if (!subscriptionPlan) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Subscription plan not found');
      }
  
      // Create new subscription
      const subscription = await Subscription.create({
        mentee_id: params.menteeId,
        mentor_id: params.mentorId,
        price_id: params.priceId,
        plan_type: params.planType,
        start_date: new Date(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        stripe_subscription_id: params.stripeSubscriptionId,
        amount: subscriptionPlan.amount,
        sessions_remaining: subscriptionPlan.total_sessions,
        sessions_per_month: subscriptionPlan.total_sessions,
        status: 'active'
      });
  
      console.log('Created new subscription:', subscription._id);
      return subscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  },

  async updateSubscriptionStatus(
    stripeSubscriptionId: string,
    status: 'active' | 'cancelled' | 'expired'
  ) {
    try {
      const subscription = await Subscription.findOneAndUpdate(
        { stripe_subscription_id: stripeSubscriptionId },
        { 
          status,
          ...(status === 'active' ? {
            start_date: new Date(),
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          } : {})
        },
        { new: true }
      );

      if (!subscription) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Subscription not found');
      }

      if (status === 'active') {
        subscription.sessions_remaining = subscription.sessions_per_month; // Reset sessions on renewal
        await subscription.save();
      }

      return subscription;
    } catch (error) {
      console.error('Error updating subscription status:', error);
      throw error;
    }
  }};