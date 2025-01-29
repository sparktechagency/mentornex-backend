
import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { StripeService } from './stripe.service';
import { Subscription } from './subscription.model';
import { PlanStructure, PlanType } from '../../../types/subscription.types';

export const SubscriptionService = {
  async createSubscription(menteeId: string, mentorId: string, planType: PlanType, stripePriceId: string) {
    const planDetails: PlanStructure = {
        lite: { sessions: 4, amount: 199 },
        standard: { sessions: 8, amount: 349 },
        pro: { sessions: 12, amount: 499 },
      };
  
      const plan = planDetails[planType];
      if (!plan) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid plan type');
      }

    // Create Stripe subscription
    const stripeSubscription = await StripeService.createSubscription(
      menteeId,
      mentorId,
      stripePriceId
    );

    // Create subscription in database
    const subscription = await Subscription.create({
      mentee_id: menteeId,
      mentor_id: mentorId,
      plan_type: planType,
      start_date: new Date(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      stripe_subscription_id: stripeSubscription.id,
      amount: plan.amount,
      sessions_remaining: plan.sessions,
      sessions_per_month: plan.sessions,
    });

    return subscription;
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
};