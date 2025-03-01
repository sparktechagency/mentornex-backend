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
  amount: number;
  planDetails : any;
  stripeConnectedAccountId: string;
  stripeConnectedCustomerId: string;
}

export const SubscriptionService = {
  async createSubscription(params: CreateSubscriptionParams) {
    try {
      // Check if subscription already exists
      const existingSubscription = await Subscription.findOne({
        stripe_subscription_id: params.stripeSubscriptionId,
      });

      if (existingSubscription) {
        console.log(
          'Subscription already exists:',
          params.stripeSubscriptionId
        );
        return existingSubscription;
      }

      // Prepare subscription data based on plan type
      let subscriptionData: any = {
        mentee_id: params.menteeId,
        mentor_id: params.mentorId,
        price_id: params.priceId,
        plan_type: params.planType,
        stripe_subscription_id: params.stripeSubscriptionId,
        amount: params.amount,
        status: 'active',
      };

      // Set specific fields based on plan type
      if (params.planType === 'Subscription') {
        // For subscription plans
        subscriptionData = {
          ...subscriptionData,
          start_date: new Date(),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          sessions_remaining: params.planDetails.total_sessions,
          sessions_per_month: params.planDetails.total_sessions,
          stripe_connected_account_id: params.stripeConnectedAccountId,
          stripe_connected_customer_id: params.stripeConnectedCustomerId,
        };
      } else if (params.planType === 'PayPerSession') {
        // For pay-per-session plans
        subscriptionData = {
          ...subscriptionData,
          start_date: new Date(),
          end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days validity for pay-per-session
          sessions_remaining: 1, // One session per payment
          sessions_per_month: 0, // Not applicable for pay-per-session
        };
      }

      // Create new subscription
      const subscription = await Subscription.create(subscriptionData);

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
          ...(status === 'active'
            ? {
                start_date: new Date(),
                end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              }
            : {}),
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
  },
};
