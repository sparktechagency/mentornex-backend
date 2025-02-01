import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { Subscription } from './subscription.model';
import { PlanStructure, PlanType } from '../../../types/subscription.types';
import { PricingPlan } from '../mentorPricingPlan/pricing-plan.model';

export const SubscriptionService = {
  async createSubscription(
    menteeId: string,
    mentorId: string,
    planType: PlanType,
    stripePriceId: string,
    stripeSubscriptionId: string
) {
    try {
        console.log("Creating subscription with:", {
            menteeId,
            mentorId,
            planType,
            stripePriceId,
            stripeSubscriptionId
        });

        // Find the pricing plan for the mentor
        const pricingPlan = await PricingPlan.findOne({ mentor_id: mentorId });
        if (!pricingPlan) {
            throw new ApiError(
                StatusCodes.NOT_FOUND,
                'Pricing plan not found for this mentor'
            );
        }

        if (!pricingPlan.subscriptions) {
            throw new ApiError(
                StatusCodes.NOT_FOUND,
                'No subscription plans found for this mentor'
            );
        }

        // Find the specific subscription plan using the price ID
        const subscriptionPlan = pricingPlan.subscriptions.find(
            (sub) => sub.stripe_price_id === stripePriceId
        );

        if (!subscriptionPlan) {
            throw new ApiError(
                StatusCodes.NOT_FOUND,
                'Subscription plan not found'
            );
        }

        // Create subscription in database
        const subscription = await Subscription.create({
            mentee_id: menteeId,
            mentor_id: mentorId,
            plan_type: planType,
            start_date: new Date(),
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            stripe_subscription_id: stripeSubscriptionId,
            amount: subscriptionPlan.amount,
            sessions_remaining: subscriptionPlan.total_sessions,
            sessions_per_month: subscriptionPlan.total_sessions,
        });

        console.log("Subscription created successfully:", subscription);
        return subscription;
    } catch (error) {
        console.error("Error creating subscription:", error);
        throw error;
    }
},
  async checkSessionsAvailable(subscriptionId: string) {
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Subscription not found');
    }

    return subscription.sessions_remaining > 0;
  },

  async deductSession(subscriptionId: string) {
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Subscription not found');
    }

    subscription.sessions_remaining -= 1;
    await subscription.save();
    return subscription;
  },

  async validatePricingPlan(mentorId: string, stripePriceId: string) {
    const pricingPlan = await PricingPlan.findOne({ mentor_id: mentorId });

    if (!pricingPlan) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Pricing plan not found for this mentor');
    }

    if (!pricingPlan.subscriptions) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'No subscription plans found for this mentor');
    }

    const subscriptionPlan = pricingPlan.subscriptions.find(
        (sub) => sub.stripe_price_id === stripePriceId
    );

    if (!subscriptionPlan) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid subscription plan selected');
    }

    return subscriptionPlan;
},
  async updateSubscriptionStatus(stripeSubscriptionId: any, status: 'active' | 'cancelled' | 'expired') {
      try {
          console.log(`Updating subscription status: ${stripeSubscriptionId} -> ${status}`);

          const subscription = await Subscription.findOne({ stripe_subscription_id: stripeSubscriptionId });

          if (!subscription) {
              console.error(`Subscription not found: ${stripeSubscriptionId}`);
              throw new ApiError(StatusCodes.NOT_FOUND, 'Subscription not found');
          }

          subscription.status = status;
          await subscription.save();

          console.log(`Subscription status updated successfully: ${subscription}`);
          return subscription;
      } catch (error: unknown) {
          if (error instanceof Error) {
              console.error(`Error updating subscription status: ${error.message}`);
          } else {
              console.error(`Error updating subscription status: Unknown error`);
          }
          throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to update subscription status');
      }
  }};
