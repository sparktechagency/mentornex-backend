import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { IPricingPlan, PayPerSession, PlanTier } from './pricing-plan.interface';
import { PricingPlan } from './pricing-plan.model';
import { StripeService } from '../subscription/stripe.service';

const createSubscriptionPlan = async (planData: IPricingPlan) => {
  // Get existing plan if any
  const existingPlan = await PricingPlan.findOne({ mentor_id: planData.mentor_id });
  
  // Check for duplicate plan tiers
  if (existingPlan) {
    const newPlans = Object.entries(planData).filter(([key]) => 
      ['lite', 'standard', 'pro'].includes(key)
    );

    for (const [tierName, tierData] of newPlans) {
      if (existingPlan[tierName as keyof typeof existingPlan]) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST, 
          `${tierName.charAt(0).toUpperCase() + tierName.slice(1)} plan already exists for this mentor`
        );
      }
    }
  }

  // Create Stripe prices for new tiers
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

  if (existingPlan) {
    // Update existing plan with new tiers
    const updateData: Partial<IPricingPlan> = {};
    if (planData.lite) updateData.lite = planData.lite;
    if (planData.standard) updateData.standard = planData.standard;
    if (planData.pro) updateData.pro = planData.pro;

    const updatedPlan = await PricingPlan.findOneAndUpdate(
      { mentor_id: planData.mentor_id },
      { $set: updateData },
      { new: true }
    );
    return updatedPlan;
  } else {
    // Create new plan
    const plan = await PricingPlan.create(planData);
    return plan;
  }
};

const createPayPerSessionPlan = async (planData: { 
  mentor_id: string, 
  pay_per_session: PayPerSession 
}) => {
  // Get existing plan if any
  const existingPlan = await PricingPlan.findOne({ mentor_id: planData.mentor_id });
  
  // Check if a plan with the same name already exists
  if (existingPlan?.pay_per_sessions?.some(
    plan => plan.name === planData.pay_per_session.name
  )) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST, 
      `Pay per session plan with name "${planData.pay_per_session.name}" already exists`
    );
  }

  // Create Stripe price for pay per session
  const price = await StripeService.createPrice({
    amount: planData.pay_per_session.amount,
    nickname: `${planData.pay_per_session.name}`,
    metadata: {
      duration: planData.pay_per_session.duration
    }
  });
  
  const newPayPerSession = {
    ...planData.pay_per_session,
    stripe_price_id: price.id
  };

  if (existingPlan) {
    // Add new pay per session plan to the array
    const updatedPlan = await PricingPlan.findOneAndUpdate(
      { mentor_id: planData.mentor_id },
      { $push: { pay_per_sessions: newPayPerSession } },
      { new: true }
    );
    return updatedPlan;
  } else {
    // Create new plan with pay per session array
    const plan = await PricingPlan.create({
      mentor_id: planData.mentor_id,
      pay_per_sessions: [newPayPerSession]
    });
    return plan;
  }
};

// Optional: Add method to delete a specific pay per session plan
const deletePayPerSessionPlan = async (mentor_id: string, planName: string) => {
  const plan = await PricingPlan.findOneAndUpdate(
    { mentor_id },
    { $pull: { pay_per_sessions: { name: planName } } },
    { new: true }
  );
  
  if (!plan) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Pricing plan not found');
  }
  
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
  getMentorPricingPlan,
  deletePayPerSessionPlan
};