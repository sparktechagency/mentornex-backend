
import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { PayPerSession, Subscription } from './pricing-plan.interface';
import { PricingPlan } from './pricing-plan.model';
import { StripeService } from '../purchase/stripe.service';
import { User } from '../user/user.model';
import { Types } from 'mongoose';
import { IPlanType } from '../../../types/plan';


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

  if (existingPlan?.subscriptions?.title === planData.subscriptions.title) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST, 
      `Subscription plan with title "${planData.subscriptions.title}" already exists`
    );
  }
  const stripeAccountId = await User.findOne({ _id: planData.mentor_id }).select('stripe_account_id');

  console.log('Stripe Account ID:', stripeAccountId?.stripe_account_id);

  if(!stripeAccountId?.stripe_account_id) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `Stripe account not found for mentor with ID ${planData.mentor_id}`
    );
  }

  if (!existingPlan) {
    await PricingPlan.create({
      mentor_id: planData.mentor_id,
      stripe_account_id: stripeAccountId.stripe_account_id
    });
  }

  const product = await StripeService.createProduct({
    title: `${planData.subscriptions.title} Plan`,
    description: planData.subscriptions.description,
    metadata: {
      sessions: Number(planData.subscriptions.total_sessions)
    },
    accountId: stripeAccountId.stripe_account_id
  });

  const price = await StripeService.createPrice({
    productId: product.id,
    amount: Number(planData.subscriptions.amount),
    accountId: stripeAccountId.stripe_account_id,
    recurring: {
      interval: 'month'
    }
  });

  // Create a payment link for this price
  const paymentLink = await StripeService.createPaymentLink({
    priceId: price.id,
    accountId: stripeAccountId.stripe_account_id,
    metadata: {
      mentorId: planData.mentor_id,
      planType: 'Subscription' as IPlanType,
      sessions: String(planData.subscriptions.total_sessions),
      amount: String(planData.subscriptions.amount),
      accountId: stripeAccountId.stripe_account_id
    }
  });

  const newSubscription = {
    ...planData.subscriptions,
    stripe_product_id: product.id,
    stripe_price_id: price.id,
    payment_link: paymentLink.url
  };

  const updatedPlan = await PricingPlan.findOneAndUpdate(
    { mentor_id: planData.mentor_id },
    { subscriptions: newSubscription },
    { new: true }
  );

  return updatedPlan;
};

const createPayPerSessionPlan = async (planData: { 
  mentor_id: string, 
  pay_per_sessions: PayPerSession 
}) => {
  const existingPlan = await PricingPlan.findOne({ mentor_id: planData.mentor_id });
  
  // Check for existing plan with the same title
  if (existingPlan?.pay_per_sessions?.some(
    session => session.title === planData.pay_per_sessions.title
  )) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST, 
      `Pay per session plan with title "${planData.pay_per_sessions.title}" already exists`
    );
  }

  // Get Stripe account ID from User model for consistency
  const stripeAccountId = await User.findOne({ _id: planData.mentor_id }).select('stripe_account_id');

  console.log('Stripe Account ID:', stripeAccountId?.stripe_account_id);

  if(!stripeAccountId?.stripe_account_id) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `Stripe account not found for mentor with ID ${planData.mentor_id}`
    );
  }

  // Create initial pricing plan if it doesn't exist
  if (!existingPlan) {
    await PricingPlan.create({
      mentor_id: planData.mentor_id,
      stripe_account_id: stripeAccountId.stripe_account_id
    });
  }

  const product = await StripeService.createProduct({
    title: `${planData.pay_per_sessions.title} Session`,
    description: planData.pay_per_sessions.description,
    metadata: {
      duration: Number(planData.pay_per_sessions.duration)
    },
    accountId: stripeAccountId.stripe_account_id
  });

  const price = await StripeService.createPrice({
    productId: product.id,
    amount: Number(planData.pay_per_sessions.amount),
    accountId: stripeAccountId.stripe_account_id
    // No recurring parameter for pay-per-session
  });

  const paymentLink = await StripeService.createPaymentLink({
    priceId: price.id,
    accountId: stripeAccountId.stripe_account_id,
    metadata: {
      mentorId: planData.mentor_id,
      planType: 'PayPerSession' as IPlanType,
      duration: planData.pay_per_sessions.duration,
      amount: String(planData.pay_per_sessions.amount),
      accountId: stripeAccountId.stripe_account_id
    }
  });

  const newPayPerSession = {
    ...planData.pay_per_sessions,
    stripe_product_id: product.id,
    stripe_price_id: price.id,
    payment_link: paymentLink.url
  };

  const updatedPlan = await PricingPlan.findOneAndUpdate(
    { mentor_id: planData.mentor_id },
    { $push: { pay_per_sessions: newPayPerSession } },
    { new: true }
  );

  return updatedPlan;
};

const getMentorPricingPlan = async (mentor_id: string) => {
  const plan = await PricingPlan.find({ mentor_id: new Types.ObjectId(mentor_id) });
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