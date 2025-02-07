import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { PayPerSession, Subscription } from './pricing-plan.interface';
import { PricingPlan } from './pricing-plan.model';
import { StripeService } from '../subscription/stripe.service';
import { User } from '../user/user.model';

const setupMentorStripeAccount = async (mentorId: string, email: string) => {
  const { accountId, onboardingUrl } = await StripeService.createConnectAccount(email);
  
  // Create or update pricing plan with Stripe account ID
  await PricingPlan.findOneAndUpdate(
    { mentor_id: mentorId },
    { 
      mentor_id: mentorId,
      stripe_account_id: accountId 
    },
    { upsert: true }
  );

  await User.findByIdAndUpdate(mentorId, {
    stripe_account_id: accountId
  });

  return { accountId, onboardingUrl };
};

const createSubscriptionPlan = async (planData: { 
  mentor_id: string, 
  subscriptions: Subscription 
}) => {
  const existingPlan = await PricingPlan.findOne({ mentor_id: planData.mentor_id });
  
  if (!existingPlan?.stripe_account_id) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST, 
      'Mentor must complete Stripe onboarding first'
    );
  }

  if (existingPlan?.subscriptions?.some(
    sub => sub.title === planData.subscriptions.title
  )) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST, 
      `Subscription plan with title "${planData.subscriptions.title}" already exists`
    );
  }

  const product = await StripeService.createProduct({
    title: `${planData.subscriptions.title} Plan`,
    description: planData.subscriptions.description,
    metadata: {
      total_sessions: Number(planData.subscriptions.total_sessions)
    },
    accountId: existingPlan.stripe_account_id
  });

  const price = await StripeService.createPrice({
    productId: product.id,
    amount: Number(planData.subscriptions.amount),
    accountId: existingPlan.stripe_account_id,
    recurring: {
      interval: 'month'
    }
  });

  const newSubscription = {
    ...planData.subscriptions,
    stripe_product_id: product.id,
    stripe_price_id: price.id
  };

  const updatedPlan = await PricingPlan.findOneAndUpdate(
    { mentor_id: planData.mentor_id },
    { $push: { subscriptions: newSubscription } },
    { new: true }
  );

  return updatedPlan;
};

const createPayPerSessionPlan = async (planData: { 
  mentor_id: string, 
  pay_per_sessions: PayPerSession 
}) => {
  const existingPlan = await PricingPlan.findOne({ mentor_id: planData.mentor_id });
  
  if (!existingPlan?.stripe_account_id) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST, 
      'Mentor must complete Stripe onboarding first'
    );
  }

  if (existingPlan?.pay_per_sessions?.some(
    session => session.title === planData.pay_per_sessions.title
  )) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST, 
      `Pay per session plan with title "${planData.pay_per_sessions.title}" already exists`
    );
  }

  const product = await StripeService.createProduct({
    title: `${planData.pay_per_sessions.title} Session`,
    description: planData.pay_per_sessions.description,
    metadata: {
      duration: planData.pay_per_sessions.duration
    },
    accountId: existingPlan.stripe_account_id
  });

  const price = await StripeService.createPrice({
    productId: product.id,
    amount: Number(planData.pay_per_sessions.amount),
    accountId: existingPlan.stripe_account_id,
    // No recurring parameter for pay-per-session
  });

  const newPayPerSession = {
    ...planData.pay_per_sessions,
    stripe_product_id: product.id,
    stripe_price_id: price.id
  };

  const updatedPlan = await PricingPlan.findOneAndUpdate(
    { mentor_id: planData.mentor_id },
    { $push: { pay_per_sessions: newPayPerSession } },
    { new: true }
  );

  return updatedPlan;
};

const getMentorPricingPlan = async (mentor_id: string) => {
  const plan = await PricingPlan.findOne({ mentor_id });
  if (!plan) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Pricing plan not found');
  }
  return plan;
};

export const PricingPlanService = {
  setupMentorStripeAccount,
  createSubscriptionPlan,
  createPayPerSessionPlan,
  getMentorPricingPlan,
};