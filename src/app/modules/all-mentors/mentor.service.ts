// import { StatusCodes } from "http-status-codes";
// import ApiError from "../../../errors/ApiError";
// import { User } from "../user/user.model";
// import { paginationHelper } from "../../../helpers/paginationHelper";
// import { IPaginationOptions } from "../../../types/pagination";
// import { IUserFilterableFields } from "../user/user.interface";

import { JwtPayload } from 'jsonwebtoken';
import { User } from '../user/user.model';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { StripeService } from '../purchase/stripe.service';
import stripe from '../../../config/stripe';
import { Purchase } from '../purchase/purchase.model';
import { IPaginationOptions } from '../../../types/pagination';
import { paginationHelper } from '../../../helpers/paginationHelper';

import { USER_SEARCHABLE_FIELDS } from '../user/user.constants';
import { ReviewMentor } from '../menteeReviews/review.model';
import { PaymentRecord } from '../payment-record/payment-record.model';
import { IUserFilterableFields } from '../user/user.interface';
import { Package, PayPerSession, Subscription } from '../plans/plans.model';
import { Session } from '../sessionBooking/session.model';
import { Types } from 'mongoose';
import { Content } from '../content/content.model';

const getAllMentorsFromDB = async (
  paginationOptions: IPaginationOptions,
  filterOptions: IUserFilterableFields
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(paginationOptions);
  const { searchTerm, focus_area, expertise, language, minPrice, maxPrice } =
    filterOptions;

  // Sort conditions
  const sortConditions: { [key: string]: 1 | -1 } = {
    ...(sortBy.toLocaleLowerCase() === 'newest' && { createdAt: -1 }),
    ...(sortBy.toLocaleLowerCase() === 'alphabetically' && { name: 1 }),
  };

  const anyCondition = [];

  if (minPrice && maxPrice) {
    // Get all the mentors based on the price from the subscription plan
    const [subscription, packages, singleSession] = await Promise.all([
      Subscription.find({
        plan_type: 'Subscription',
        amount: { $gte: minPrice, $lte: maxPrice },
      }).distinct('mentor_id'),
      Package.find({
        amount: { $gte: minPrice, $lte: maxPrice },
      }).distinct('mentor_id'),
      PayPerSession.find({
        amount: { $gte: minPrice, $lte: maxPrice },
      }).distinct('mentor_id'),
    ]);
    const mentors = [
      ...new Set([...subscription, ...packages, ...singleSession]),
    ];
    anyCondition.push({ _id: { $in: mentors } });
  }

  if (searchTerm) {
    anyCondition.push({
      $or: USER_SEARCHABLE_FIELDS.map(field => {
        if (Array.isArray(field)) {
          // Handle the case where the field is an array
          return {
            [field]: { $elemMatch: { $regex: searchTerm, $options: 'i' } },
          };
        } else {
          // Handle regular fields (non-array)
          return { [field]: { $regex: searchTerm, $options: 'i' } };
        }
      }),
    });
  }

  if (focus_area) {
    anyCondition.push({ focus_area: { $in: focus_area } });
  }

  if (expertise) {
    anyCondition.push({ expertise: { $in: expertise } });
  }

  if (language) {
    anyCondition.push({ language: { $in: language } });
  }

  anyCondition.push({ role: 'MENTOR' });
  const whereCondition = anyCondition.length > 0 ? { $and: anyCondition } : {};

  const result = await User.find(whereCondition)
    .populate({
      path: 'industry',
      select: { name: 1, image: 1 },
    })
    .sort(sortConditions)
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await User.countDocuments(whereCondition);

  // const mentorWithStartingPrices = await getMentorsWithReviewsAndPrices(result, sortBy);

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

const getAllActiveMentorsFromDB = async (
  paginationOptions: IPaginationOptions
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(paginationOptions);

  const sortConditions: { [key: string]: 1 | -1 } = {};
  if (sortBy && sortOrder) {
    sortConditions[sortBy] = sortOrder === 'asc' ? 1 : -1;
  }

  const result = await User.find({ role: 'MENTOR', status: 'active' })
    .populate({
      path: 'industry',
      select: { name: 1, image: 1 },
    })
    .sort(sortConditions)
    .skip(skip)
    .limit(limit);

  const total = await User.countDocuments({ role: 'MENTOR', status: 'active' });

  if (!result.length) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'No active mentors found');
  }

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

const getSingleMentor = async (id: string) => {
  // Check if the mentor exists
  const isExist = await User.findById(id)
    .populate({
      path: 'industry',
      select: { name: 1, image: 1 },
    })
    .lean();
  if (!isExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Mentor not found');
  }

  // Count total repeated user sessions
  const [totalSessionCount, repeatedUserSessions, goalAchievingRate, content] =
    await Promise.all([
      // Get total session count
      Session.countDocuments({ mentor_id: id, status: 'completed' }),

      // Count total repeated user sessions
      PaymentRecord.aggregate([
        { $match: { mentor_id: id, status: 'succeeded' } },
        { $group: { _id: '$user_id', sessionCount: { $sum: 1 } } },
        { $match: { sessionCount: { $gt: 1 } } },
        { $count: 'repeatedUserCount' },
      ]),

      // Calculate goal achieving rate from the review collection
      ReviewMentor.aggregate([
        { $match: { mentor_id: id } },
        {
          $group: {
            _id: null,
            totalGoalAchieved: { $sum: '$goalAchieved' },
            totalReviews: { $sum: 1 },
          },
        },
        {
          $project: {
            goalAchievingRate: {
              $cond: {
                if: { $eq: ['$totalReviews', 0] },
                then: 0,
                else: {
                  $multiply: [
                    { $divide: ['$totalGoalAchieved', '$totalReviews'] },
                    100,
                  ],
                },
              },
            },
          },
        },
      ]),
      Content.find({ mentor: id, type: 'intro' }).lean(),
    ]);

  // Extract the repeated user count (default to 0 if no repeated sessions)
  const repeatedUserCount =
    repeatedUserSessions.length > 0
      ? repeatedUserSessions[0].repeatedUserCount
      : 0;

  const { stripe_account_id, stripeCustomerId, ...rest } = isExist;
  rest.isConnected = !!stripe_account_id;
  return {
    ...rest,
    content: content[0].url,
    totalSessionCount,
    repeatedUserCount,
    goalAchievingRate: goalAchievingRate[0]?.goalAchievingRate || 0,
  };
};

const onboardMentorToStripe = async (user: JwtPayload) => {
  try {
    const isUserExist = await User.findById(user.id).lean();

    if (!isUserExist) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
    }
    const { stripe_account_id, status } = isUserExist;
    if (status === 'delete') {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'The account has been deleted.'
      );
    }
    let newStripeAccountId = stripe_account_id;
    if (!stripe_account_id) {
      const account = await StripeService.createConnectAccount(
        isUserExist.email
      );
      if (!account.accountId) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          'Failed to create Stripe account'
        );
      }

      await User.findByIdAndUpdate(user.id, {
        $set: { stripe_account_id: account.accountId },
      });
      newStripeAccountId = account.accountId;
    }

    const accountLinks = await stripe.accountLinks.create({
      account: newStripeAccountId!,
      refresh_url: `${process.env.FRONTEND_URL}/stripe/refresh`,
      return_url: `${process.env.FRONTEND_URL}/stripe/return`,
      type: 'account_onboarding',
    });

    return { onboardingUrl: accountLinks.url };
  } catch (error) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to onboard mentor to Stripe'
    );
  }
};

const createStripeLoginLink = async (user: JwtPayload) => {
  try {
    const isUserExist = await User.findById(user.id).lean();
    if (!isUserExist) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
    }
    const { stripe_account_id, status } = isUserExist;
    if (status === 'delete') {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'The account has been deleted.'
      );
    }
    if (!stripe_account_id) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Stripe account not found');
    }
    const loginLink = await StripeService.createLoginLink(stripe_account_id);
    return { loginUrl: loginLink };
  } catch (error) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to create Stripe login link'
    );
  }
};

const getMenteeByMentor = async (
  user: JwtPayload,
  paginationOptions: IPaginationOptions,
  filters: { searchTerm?: string }
) => {
  const { searchTerm } = filters;
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(paginationOptions);

  const anyCondition = [];
  if (searchTerm) {
    anyCondition.push({ name: { $regex: searchTerm, $options: 'i' } });
  }
  anyCondition.push({ mentor_id: user.id });
  const whereCondition =
    anyCondition.length > 0 ? { $and: anyCondition } : { mentor_id: user.id };
  //get all the subscripted or purchased mentee for mentor and reply only the mentor info not the payment
  const mentees = await PaymentRecord.find(whereCondition)
    .populate<{
      mentee_id: { _id: Types.ObjectId; name: string; image: string };
    }>({ path: 'mentee_id', select: { _id: 1, name: 1, image: 1 } })
    .lean();

  const returnable = mentees.map(mentee => {
    return {
      _id: mentee._id,
      name: mentee.mentee_id.name,
      image: mentee.mentee_id.image,
    };
  });

  const total = await PaymentRecord.countDocuments(whereCondition);
  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: returnable,
  };
};

export const MentorService = {
  getAllMentorsFromDB,
  // getAllActiveMentorsFromDB,
  getSingleMentor,
  onboardMentorToStripe,
  createStripeLoginLink,
  getMenteeByMentor,
};
