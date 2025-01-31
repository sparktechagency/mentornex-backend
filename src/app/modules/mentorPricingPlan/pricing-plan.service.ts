import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { IPricingPlan, PayPerSession, Subscription } from './pricing-plan.interface';
import { PricingPlan } from './pricing-plan.model';
import { StripeService } from '../subscription/stripe.service';

const createSubscriptionPlan = async (planData: { 
  mentor_id: string, 
  subscriptions: Subscription 
}) => {
  // Get existing plan if any
  const existingPlan = await PricingPlan.findOne({ mentor_id: planData.mentor_id });
  
  // Check if a subscription with the same title already exists
  if (existingPlan?.subscriptions?.some(
    sub => sub.title === planData.subscriptions.title
  )) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST, 
      `Subscription plan with title "${planData.subscriptions.title}" already exists`
    );
  }

  // Create Stripe product and price for subscription
  const product = await StripeService.createProduct({
    title: `${planData.subscriptions.title} Plan`,
    description: planData.subscriptions.description,
    metadata: {
      total_sessions: Number(planData.subscriptions.total_sessions)
    }
  });

  const price = await StripeService.createPrice({
    productId: product.id,
    amount: Number(planData.subscriptions.amount),
    recurring: {
      interval: 'month'
    }
  });

  const newSubscription = {
    ...planData.subscriptions,
    stripe_product_id: product.id,
    stripe_price_id: price.id
  };

  if (existingPlan) {
    // Add new subscription plan to the array
    const updatedPlan = await PricingPlan.findOneAndUpdate(
      { mentor_id: planData.mentor_id },
      { $push: { subscriptions: newSubscription } },
      { new: true }
    );
    return updatedPlan;
  } else {
    // Create new plan with subscription array
    const plan = await PricingPlan.create({
      mentor_id: planData.mentor_id,
      subscriptions: [newSubscription]
    });
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
    plan => plan.title === planData.pay_per_session.title
  )) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST, 
      `Pay per session plan with name "${planData.pay_per_session.title}" already exists`
    );
  }

  // Create Stripe product and price for pay per session
  const product = await StripeService.createProduct({
    title: planData.pay_per_session.title,
    description: planData.pay_per_session.description,
    metadata: {
      duration: planData.pay_per_session.duration
    }
  });

  const price = await StripeService.createPrice({
    productId: product.id,
    amount: planData.pay_per_session.amount
  });
  
  const newPayPerSession = {
    ...planData.pay_per_session,
    stripe_product_id: product.id,
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

// Optional: Add method to delete a specific subscription plan
const deleteSubscriptionPlan = async (mentor_id: string, title: string) => {
  const plan = await PricingPlan.findOneAndUpdate(
    { mentor_id },
    { $pull: { subscriptions: { title: title } } },
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
  deleteSubscriptionPlan,
};