import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import {
  IPackage,
  IPayPerSession,
  ISubscription,
  PLAN_STATUS,
} from './plans.interface';
import { Package, PayPerSession, Subscription } from './plans.model';
import { Types } from 'mongoose';
import { JwtPayload } from 'jsonwebtoken';
import { User } from '../user/user.model';
import { StripeService } from '../purchase/stripe.service';

const createPayPerSession = async (
  payload: IPayPerSession,
  user: JwtPayload
) => {
  payload.mentor_id = user.id;
  const result = await PayPerSession.create(payload);
  if (!result)
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Failed to create pay per session'
    );
  return result;
};

const updatePayPerSession = async (
  id: Types.ObjectId,
  payload: IPayPerSession,
  user: JwtPayload
) => {
  const isPayPerSessionExist = await PayPerSession.findById(id).lean();
  if (!isPayPerSessionExist)
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Pay per session not found');

  if (isPayPerSessionExist.mentor_id.toString() !== user.id)
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'You are not authorized to update this pay per session'
    );

  const result = await PayPerSession.findByIdAndUpdate(
    id,
    { $set: payload },
    { new: true }
  );
  if (!result)
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Failed to update pay per session'
    );
  return result;
};

const deletePayPerSession = async (id: Types.ObjectId, user: JwtPayload) => {
  const isPayPerSessionExist = await PayPerSession.findById(id).lean();
  if (!isPayPerSessionExist)
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Pay per session not found');
  if (isPayPerSessionExist.mentor_id.toString() !== user.id)
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'You are not authorized to delete this pay per session'
    );

  const result = await PayPerSession.findByIdAndUpdate(
    id,
    { $set: { status: 'inactive' } },
    { new: true }
  );
  if (!result)
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Failed to delete pay per session'
    );
  return result;
};

const createPackage = async (payload: IPackage, user: JwtPayload) => {
  const isMaxed =
    (await Package.countDocuments({
      mentor_id: user.id,
      status: PLAN_STATUS.ACTIVE,
    })) >= 3;

  if (isMaxed)
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'You can only have 3 active packages'
    );
  payload.mentor_id = user.id;
  const result = await Package.create(payload);
  if (!result)
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create package');
  return result;
};

const updatePackage = async (
  id: Types.ObjectId,
  payload: IPackage,
  user: JwtPayload
) => {
  const isPackageExist = await Package.findById(id).lean();
  if (!isPackageExist)
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Package not found');
  if (isPackageExist.mentor_id.toString() !== user.id)
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'You are not authorized to update this package'
    );

  const result = await Package.findByIdAndUpdate(
    id,
    { $set: payload },
    { new: true }
  );
  if (!result)
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to update package');
  return result;
};

const deletePackage = async (id: Types.ObjectId, user: JwtPayload) => {
  const isPackageExist = await Package.findById(id).lean();
  if (!isPackageExist)
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Package not found');
  if (isPackageExist.mentor_id.toString() !== user.id)
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'You are not authorized to delete this package'
    );

  const result = await Package.findByIdAndUpdate(
    id,
    { $set: { status: 'inactive' } },
    { new: true }
  );
  if (!result)
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to delete package');
  return result;
};

const createSubscriptionPlan = async (
  payload: ISubscription,
  user: JwtPayload
) => {
  // Fetch existing plans and Stripe account ID in parallel
  const [existingPlan, stripeAccountId] = await Promise.all([
    Subscription.find({
      mentor_id: user.id,
      status: PLAN_STATUS.ACTIVE,
    }).lean(),
    User.findOne({ _id: user.id }).select('stripe_account_id').lean(),
  ]);

  // Ensure that the mentor doesn't already have 3 plans
  if (existingPlan.length >= 1) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'You can only have 1 subscription plans at a time.'
    );
  }

  // Ensure the mentor has a Stripe account ID
  if (!stripeAccountId?.stripe_account_id) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `Stripe account not found for mentor with ID ${user.id}`
    );
  }

  // Create a new product in Stripe
  const product = await StripeService.createProduct({
    title: `${payload.title}`,
    description: payload.description,
    metadata: {},
    accountId: stripeAccountId.stripe_account_id,
  });

  // Create the price for the product in Stripe
  const price = await StripeService.createPrice({
    productId: product.id,
    amount: Number(payload.amount),
    accountId: stripeAccountId.stripe_account_id,
    recurring: {
      interval: 'month', // Set the interval as monthly
    },
  });

  // Assign Stripe product and price IDs to the payload
  payload.stripe_product_id = product.id;
  payload.stripe_price_id = price.id;
  payload.mentor_id = user.id;
  payload.stripe_account_id = stripeAccountId.stripe_account_id;

  // Save the subscription plan to the database
  const result = await Subscription.create(payload);

  // If subscription creation failed, throw an error
  if (!result) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Failed to create subscription plan'
    );
  }

  // Return the newly created subscription plan
  return result;
};

const updateSubscriptionPlan = async (
  id: Types.ObjectId,
  payload: ISubscription,
  user: JwtPayload
) => {
  const isSubscriptionPlanExist = await Subscription.findById(id).lean();
  if (!isSubscriptionPlanExist)
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Subscription plan not found');
  if (isSubscriptionPlanExist.mentor_id.toString() !== user.id)
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'You are not authorized to update this subscription plan'
    );

  //check if price is updated
  if (payload.amount && payload.amount !== isSubscriptionPlanExist.amount) {
    const price = await StripeService.createPrice({
      productId: isSubscriptionPlanExist.stripe_product_id,
      amount: Number(payload.amount),
      accountId: isSubscriptionPlanExist.stripe_account_id,
      recurring: {
        interval: 'month', // Set the interval as monthly,
      },
    });
    if (!price)
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to update price');
    payload.stripe_price_id = price.id;
  }

  if (payload.title || payload.description) {
    const product = await StripeService.updateProduct({
      productId: isSubscriptionPlanExist.stripe_product_id,
      title: payload.title || isSubscriptionPlanExist.title,
      description: payload.description || isSubscriptionPlanExist.description,
      metadata: {},
      accountId: isSubscriptionPlanExist.stripe_account_id,
    });
    if (!product)
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to update product');
  }

  const result = await Subscription.findByIdAndUpdate(
    id,
    { $set: payload },
    { new: true }
  );
  if (!result)
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Failed to update subscription plan'
    );
  return result;
};

// const deleteSubscriptionPlan = async (id: Types.ObjectId, user:JwtPayload) => {
//     const isSubscriptionPlanExist = await Subscription.findById(id).lean();
//     if(!isSubscriptionPlanExist) throw new ApiError(StatusCodes.BAD_REQUEST, 'Subscription plan not found');
//     if(isSubscriptionPlanExist.mentor_id.toString() !== user.id) throw new ApiError(StatusCodes.BAD_REQUEST, 'You are not authorized to delete this subscription plan');

//     const removePrice = await StripeService.removePrice(isSubscriptionPlanExist.stripe_price_id, isSubscriptionPlanExist.stripe_account_id);
//     const deleteProduct = await StripeService.deleteProduct(isSubscriptionPlanExist.stripe_product_id, isSubscriptionPlanExist.stripe_account_id);

//     if(!removePrice || !deleteProduct) throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to delete subscription plan');

//     const result = await Subscription.findByIdAndUpdate(id, {$set: {status: 'inactive'}}, { new: true });
//     if(!result) throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to delete subscription plan');
//     return result;
// }

const deleteSubscriptionPlan = async (id: Types.ObjectId, user: JwtPayload) => {
  const isSubscriptionPlanExist = await Subscription.findById(id).lean();
  if (!isSubscriptionPlanExist) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Subscription plan not found');
  }
  if (isSubscriptionPlanExist.mentor_id.toString() !== user.id) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'You are not authorized to delete this subscription plan'
    );
  }

  try {
    // Step 1: Deactivate all prices associated with the product
    await StripeService.deactivateAllPricesForProduct(
      isSubscriptionPlanExist.stripe_product_id,
      isSubscriptionPlanExist.stripe_account_id
    );

    // Step 2: Delete the product
    const deleteProduct = await StripeService.deleteProduct(
      isSubscriptionPlanExist.stripe_product_id,
      isSubscriptionPlanExist.stripe_account_id
    );

    if (!deleteProduct) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Failed to delete subscription plan'
      );
    }

    // Step 3: Update the subscription plan status to 'inactive'
    const result = await Subscription.findByIdAndUpdate(
      id,
      { $set: { status: 'inactive' } },
      { new: true }
    );

    if (!result) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Failed to delete subscription plan'
      );
    }

    return result;
  } catch (error) {
    //@ts-ignore
    console.error('Error deleting subscription plan:', error.message);
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'An error occurred while deleting the subscription plan'
    );
  }
};

const getPricingPlans = async (mentorId: Types.ObjectId) => {
  const [payPerSession, packages, subscriptions] = await Promise.all([
    PayPerSession.find({
      status: PLAN_STATUS.ACTIVE,
      mentor_id: mentorId,
    }).lean(),
    Package.find({ status: PLAN_STATUS.ACTIVE, mentor_id: mentorId }).lean(),
    Subscription.find(
      { status: PLAN_STATUS.ACTIVE, mentor_id: mentorId },
      { stripe_product_id: 0, stripe_price_id: 0, stripe_account_id: 0 }
    ).lean(),
  ]);
  if (!payPerSession || !packages || !subscriptions)
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to get pricing plans');
  return { payPerSession, packages, subscriptions };
};

export const PlansServices = {
  createPayPerSession,
  updatePayPerSession,
  deletePayPerSession,
  createPackage,
  updatePackage,
  deletePackage,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  getPricingPlans,
};
