import { JwtPayload } from 'jsonwebtoken';
import {
  PURCHASE_PLAN_STATUS,
  PLAN_TYPE,
  PAYMENT_STATUS,
} from './purchase.interface';
import { Types } from 'mongoose';
import { Package, PayPerSession, Subscription } from '../plans/plans.model';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { StripeService } from './stripe.service';
import { Purchase } from './purchase.model';
import { IUser } from '../user/user.interface';
import {
  IPackage,
  IPayPerSession,
  ISubscription,
  PLAN_STATUS,
} from '../plans/plans.interface';
import { User } from '../user/user.model';
import { Session } from '../sessionBooking/session.model';
import { SESSION_STATUS } from '../sessionBooking/session.interface';
import { getRemainingQuotaForPackageOrSubscription } from '../sessionBooking/session.utils';
import { SessionService } from '../sessionBooking/session.service';

// const purchasePayPerSession = async (
//   user: JwtPayload,
//   id: Types.ObjectId,
//   payload: { date: string; slot: string }
// ) => {
//   const [payPerSession, isUserExist] = await Promise.all([
//     PayPerSession.findById(id)
//       .populate<{
//         mentor_id: {
//           _id: Types.ObjectId;
//           stripeCustomerId: string;
//           stripe_account_id: string;
//           timezone: string;
//         };
//       }>({
//         path: 'mentor_id',
//         select: {
//           _id: 1,
//           stripeCustomerId: 1,
//           stripe_account_id: 1,

//           timeZone: 1,
//         },
//       })
//       .lean(),
//     User.findById(user.id).select('timeZone status').lean(),
//   ]);

//   console.log(payPerSession);
//   if (!payPerSession) {
//     throw new ApiError(StatusCodes.NOT_FOUND, 'Requested plan does not exist.');
//   }
//   if (!payPerSession.mentor_id.stripe_account_id)
//     throw new ApiError(
//       StatusCodes.BAD_REQUEST,
//       'Mentor is not eligible to sell this session.'
//     );
//   if (!isUserExist || isUserExist.status !== 'active')
//     throw new ApiError(
//       StatusCodes.BAD_REQUEST,
//       'You are not authorized to purchase this session.'
//     );
//   if (payPerSession.status !== PLAN_STATUS.ACTIVE)
//     throw new ApiError(
//       StatusCodes.BAD_REQUEST,
//       'Session is not active. Please contact with the mentor.'
//     );
//   const { stripeCustomerId, stripe_account_id, _id } = payPerSession.mentor_id;
//   const payment = await StripeService.createCheckoutSession(
//     stripeCustomerId!,
//     user.id,
//     _id!.toString(),
//     payPerSession.title,
//     PLAN_TYPE.PayPerSession,
//     stripe_account_id as string,
//     payPerSession.amount,
//     undefined,
//     payPerSession._id.toString()
//   );
//   if (!payment) {
//     throw new ApiError(
//       StatusCodes.BAD_REQUEST,
//       'Failed to create checkout session.'
//     );
//   }

//   const sessionRequestPayload = {
//     // mentee_id: user.id,
//     mentor_id: payPerSession.mentor_id,
//     topic: payPerSession.title,
//     session_plan_type: PLAN_TYPE.PayPerSession,
//     pay_per_session_id: payPerSession._id,
//     plan_type: PLAN_TYPE.PayPerSession,
//     date: payload.date,
//     slot: payload.slot,
//   };

//   await SessionService.createSessionRequest(
//     user,
//     {
//       mentee_id: user.id,
//       mentor_id: payPerSession.mentor_id._id,
//       topic: payPerSession.title,
//       session_plan_type: PLAN_TYPE.PayPerSession,
//       pay_per_session_id: payPerSession._id,
//       date: payload.date,
//       slot: payload.slot,
//       scheduled_time: new Date(),
//       end_time: new Date(),
//       status: SESSION_STATUS.PENDING,
//     },
//     user.timeZone
//   );

//   return payment.url;
// };

const purchasePackage = async (user: JwtPayload, id: Types.ObjectId) => {
  //check whether the requested user already have a package.
  const isAlreadyPurchased = await Purchase.findOne({
    mentee_id: user.id,
    plan_type: PLAN_TYPE.Package,
    plan_status: PURCHASE_PLAN_STATUS.ACTIVE,
  }).lean();
  if (isAlreadyPurchased)
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'You already have a package with this mentor. After the package quota is over, you can purchase another package.'
    );

  const pkg = await Package.findById(id)
    .populate<{ mentor_id: Partial<IUser> }>({
      path: 'mentor_id',
      select: { stripeCustomerId: 1, stripe_account_id: 1, _id: 1 },
    })
    .lean();
  if (!pkg) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Requested package does not exist.'
    );
  }
  if (pkg.status !== 'active')
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Package is not active.');

  const { stripeCustomerId, stripe_account_id, _id } = pkg.mentor_id;

  const purchasePayload = {
    mentor_id: pkg.mentor_id,
    mentee_id: user.id,
    package_id: pkg._id,
    totalSessions: pkg.sessions,
    remaining_sessions: pkg.sessions,
    plan_type: PLAN_TYPE.Package,
    amount: pkg.amount,
    checkout_session_id: '',
    application_fee: pkg.amount * 0.1,
  };

  const payment = await StripeService.createCheckoutSession(
    stripeCustomerId!,
    user.id,
    _id!.toString(),
    pkg.title,
    PLAN_TYPE.Package,
    stripe_account_id as string,
    pkg.amount,
    undefined,
    pkg._id.toString()
  );

  if (!payment) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Failed to create checkout session.'
    );
  }

  purchasePayload.checkout_session_id = payment.sessionId;

  const result = await Purchase.create(purchasePayload);
  if (!result)
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create purchase.');
  return payment.url;
};

const purchaseSubscription = async (user: JwtPayload, id: Types.ObjectId) => {
  const [subscription, isAlreadyPurchased] = await Promise.all([
    Subscription.findById(id)
      .populate<{ mentor_id: Partial<IUser> }>({
        path: 'mentor_id',
        select: { stripeCustomerId: 1, stripe_account_id: 1, _id: 1 },
      })
      .lean(),
    Purchase.findOne({
      mentee_id: user.id,
      plan_type: PLAN_TYPE.Subscription,
      is_active: true,
      status: PAYMENT_STATUS.PAID, //payment status is success, means the subscription is active and mentee can access the content for the package or subscriptio
      plan_status: PURCHASE_PLAN_STATUS.ACTIVE,
    }).lean(),
  ]);
  if (!subscription) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Requested subscription does not exist.'
    );
  }

  if (isAlreadyPurchased)
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'You already have a subscription with this mentor. In order to purchase another subscription, you need to cancel the existing subscription first.'
    );

  const { stripeCustomerId, stripe_account_id, _id } = subscription.mentor_id;

  const purchasePayload = {
    mentor_id: subscription.mentor_id,
    mentee_id: user.id,
    subscription_id: subscription._id,
    plan_type: PLAN_TYPE.Subscription,
    amount: subscription.amount,
    checkout_session_id: '',
    // remaining_sessions: subscription.sessions,
    application_fee: subscription.amount * 0.1,
  };

  const payment = await StripeService.createCheckoutSession(
    stripeCustomerId!,
    user.id,
    _id!.toString(),
    `Content Views`,
    PLAN_TYPE.Subscription,
    stripe_account_id as string,
    subscription.amount,
    subscription.stripe_price_id,
    subscription._id.toString()
  );

  if (!payment) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Failed to create checkout session.'
    );
  }

  purchasePayload.checkout_session_id = payment.sessionId;
  const result = await Purchase.create(purchasePayload);
  if (!result)
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create purchase.');
  return payment.url;
};

const cancelSubscription = async (user: JwtPayload, id: Types.ObjectId) => {
  const subscription = await Purchase.findById(id);

  if (!subscription) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Requested subscription does not exist.'
    );
  }

  if (subscription.mentee_id.toString() !== user.id)
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'You are not authorized to cancel this subscription'
    );

  const canceledSubscription = await StripeService.cancelSubscription(
    subscription.stripe_subscription_id!
  );

  if (!canceledSubscription) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Failed to cancel subscription.'
    );
  }
};

const getMenteeAvailablePlansAndRemainingQuota = async (
  user: JwtPayload,
  mentorId: Types.ObjectId
) => {
  const [isPackageExist, isSubscriptionExist] = await Promise.all([
    Purchase.findOne({
      mentee_id: user.id,
      mentor_id: mentorId,
      plan_type: PLAN_TYPE.Package,
      plan_status: PURCHASE_PLAN_STATUS.ACTIVE,
      is_active: true,
    })
      .populate<{ package_id: Partial<IPackage> }>({
        path: 'package_id',
        select: { _id: 1, sessions: 1 },
      })
      .lean(),
    Purchase.findOne({
      mentee_id: user.id,
      mentor_id: mentorId,
      plan_type: PLAN_TYPE.Subscription,
      plan_status: PURCHASE_PLAN_STATUS.ACTIVE,
      is_active: true,
    })
      .populate<{ subscription_id: Partial<ISubscription> }>({
        path: 'subscription_id',
        select: { _id: 1, sessions: 1 },
      })
      .lean(),
  ]);
  //now get the remaining quota for the package and subscription

  if (!isPackageExist && !isSubscriptionExist)
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'You have no active packages or subscriptions with this mentor.'
    );

  const [bookedPackageSessionCount, bookedSubscriptionSessionCount] =
    await Promise.all([
      getRemainingQuotaForPackageOrSubscription(
        user.id,
        mentorId,
        isPackageExist?.package_id?._id
      ),
      getRemainingQuotaForPackageOrSubscription(
        user.id,
        mentorId,
        undefined,
        isSubscriptionExist?.subscription_id?._id
      ),
    ]);
  return {
    package: {
      ...isPackageExist,
      totalSession: isPackageExist?.package_id!.sessions,
      remainingSession:
        (isPackageExist?.package_id!.sessions! || 0) -
        bookedPackageSessionCount,
    },
    subscription: {
      ...isSubscriptionExist,
    },
  };
};

const getAllPackageAndSubscription = async (user: JwtPayload) => {
  const [isPayPerSessionExist, isPackageExist, isSubscriptionExist] =
    await Promise.all([
      Purchase.find({
        mentee_id: user.id,
        plan_type: PLAN_TYPE.PayPerSession,

        is_active: true,
      }),
      Purchase.find({
        mentee_id: user.id,
        plan_type: PLAN_TYPE.Package,

        is_active: true,
      })
        .populate({ path: 'mentor_id', select: { _id: 1, name: 1, image: 1 } })
        .populate<{ package_id: Partial<IPackage> }>({
          path: 'package_id',
          select: { _id: 1, title: 1, sessions: 1 },
        })
        .lean(),
      Purchase.find({
        mentee_id: user.id,
        plan_type: PLAN_TYPE.Subscription,

        is_active: true,
      })
        .populate({ path: 'mentor_id', select: { _id: 1, name: 1, image: 1 } })
        .populate<{ subscription_id: Partial<ISubscription> }>({
          path: 'subscription_id',
          select: { _id: 1, title: 1, sessions: 1 },
        })
        .lean(),
    ]);

  return { package: isPackageExist, subscription: isSubscriptionExist };
};

export const PurchaseServices = {
  // purchasePayPerSession,
  purchasePackage,
  purchaseSubscription,
  cancelSubscription,
  getMenteeAvailablePlansAndRemainingQuota,
  getAllPackageAndSubscription,
};
