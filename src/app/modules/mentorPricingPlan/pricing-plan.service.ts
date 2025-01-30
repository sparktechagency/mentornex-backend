import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { IPricingPlan } from './pricing-plan.interface';
import { PricingPlan } from './pricing-plan.model';
import { StripeService } from '../subscription/stripe.service';

const createSubscriptionPlan = async (planData: IPricingPlan) => {
  // Check if mentor already has a plan
  const existingPlan = await PricingPlan.findOne({ mentor_id: planData.mentor_id });
  if (existingPlan) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Pricing plan already exists for this mentor');
  }

  // Create Stripe prices for each tier
  if (planData.lite) {
    const litePrice = await StripeService.createPrice({
      amount: planData.lite.amount,
      nickname: `${planData.lite.name} Plan`,
      recurring: {
        interval: 'month'
      },
      metadata: {
        total_sessions: planData.lite.total_sessions
      }
    });
    planData.lite.stripe_price_id = litePrice.id;
  }

  if (planData.standard) {
    const standardPrice = await StripeService.createPrice({
      amount: planData.standard.amount,
      nickname: `${planData.standard.name} Plan`,
      recurring: {
        interval: 'month'
      },
      metadata: {
        total_sessions: planData.standard.total_sessions
      }
    });
    planData.standard.stripe_price_id = standardPrice.id;
  }

  if (planData.pro) {
    const proPrice = await StripeService.createPrice({
      amount: planData.pro.amount,
      nickname: `${planData.pro.name} Plan`,
      recurring: {
        interval: 'month'
      },
      metadata: {
        total_sessions: planData.pro.total_sessions
      }
    });
    planData.pro.stripe_price_id = proPrice.id;
  }

  // Create plan in database
  const plan = await PricingPlan.create(planData);
  return plan;
};

const createPayPerSessionPlan = async (planData: IPricingPlan) => {
  // Check if mentor already has a plan
  const existingPlan = await PricingPlan.findOne({ mentor_id: planData.mentor_id });
  if (existingPlan) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Pricing plan already exists for this mentor');
  }

  if (planData.pay_per_session) {
    // Create Stripe price for pay per session
    const price = await StripeService.createPrice({
      amount: planData.pay_per_session.amount,
      nickname: `${planData.pay_per_session.name}`,
      metadata: {
        duration: planData.pay_per_session.duration
      }
    });
    planData.pay_per_session.stripe_price_id = price.id;
  }

  // Create plan in database
  const plan = await PricingPlan.create(planData);
  return plan;
};

const getMentorPricingPlan = async (mentor_id: string) => {
  const plan = await PricingPlan.findOne({ mentor_id });
  if (!plan) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Pricing plan not found');
  }
  return plan;
};

export const PricingPlanService = {
  createSubscriptionPlan,
  createPayPerSessionPlan,
  getMentorPricingPlan
};