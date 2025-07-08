import { StatusCodes } from 'http-status-codes';
import { JwtPayload } from 'jsonwebtoken';
import { USER_ROLES } from '../../../enums/user';
import ApiError from '../../../errors/ApiError';
import { emailHelper } from '../../../helpers/emailHelper';
import { emailTemplate } from '../../../shared/emailTemplate';
import unlinkFile from '../../../shared/unlinkFile';
import generateOTP from '../../../util/generateOTP';
import { IUser } from './user.interface';
import { User } from './user.model';
import stripe from '../../../config/stripe';
import { ReviewMentor } from '../menteeReviews/review.model';
import { PaymentRecord } from '../payment-record/payment-record.model';
import { Session } from '../sessionBooking/session.model';
import { SESSION_STATUS } from '../sessionBooking/session.interface';
import { Types } from 'mongoose';
import { Purchase } from '../purchase/purchase.model';
import { PURCHASE_PLAN_STATUS } from '../purchase/purchase.interface';

const createUserToDB = async (payload: Partial<IUser>): Promise<IUser> => {

  // Check if user already exists
  const isExistUser = await User.findOne({ email: payload.email, status:{$ne: 'delete'} });
  if (isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'An account with this email already exists, please login or try with another email.');
  }

  //set role
  //payload.role = USER_ROLES.MENTEE;
  const stripeCustomer = await stripe.customers.create({
    email: payload.email || '',
    name: payload.name || '',
    metadata: { role: payload.role ? payload.role.toString() : '' },
  });


  if(!stripeCustomer || !stripeCustomer.id) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Something went wrong, please try again later.');
  }

  // Add Stripe Customer ID to the user payload
  payload.stripeCustomerId = stripeCustomer.id;
  const createUser = await User.create(payload);
  if (!createUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create user');
  }
  
  //send email
  const otp = generateOTP();
  const values = {
    name: createUser.name,
    otp: otp,
    email: createUser.email!,
  };
  const createAccountTemplate = emailTemplate.createAccount(values);
  emailHelper.sendEmail(createAccountTemplate);

  //save to DB
  const authentication = {
    oneTimeCode: otp,
    expireAt: new Date(Date.now() + 3 * 60000),
  };
  await User.findOneAndUpdate(
    { _id: createUser._id },
    { $set: { authentication } }
  );

  return createUser;
};


const getUserProfileFromDB = async (user: JwtPayload) => {
  const { id } = user;

  // Check if the user exists
  const isExistUser = await User.findById(id)
    .populate({
      path: "industry",
      select: { name: 1, image: 1 }
    })
    .lean();

  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  if(isExistUser.role === USER_ROLES.MENTEE) {
    const activeSubscription = await Purchase.countDocuments({ mentee_id: id, is_active: true });
    const activeMentors = await Purchase.countDocuments({ mentee_id: id}).distinct('mentor_id');
    const sessionCompleted = await Session.countDocuments({ mentee_id: id, status: SESSION_STATUS.COMPLETED });
    return {
      ...isExistUser,
      activeSubscription,
      activeMentors: activeMentors.length,
      sessionCompleted
    }
  }

  if (isExistUser.role === USER_ROLES.MENTOR) {
    // Run the queries concurrently
    const [totalSessionCount, repeatedUserSessions, goalAchievingRate] = await Promise.all([
      // Total completed sessions
      Session.countDocuments({ mentor_id: id, status: {$in:[SESSION_STATUS.ACCEPTED,SESSION_STATUS.RESCHEDULED, SESSION_STATUS.COMPLETED]} }),

      // Count distinct mentees with more than 1 session with this mentor
      Session.aggregate([
        {
          $match: {
            mentor_id: new Types.ObjectId(id), // Ensure ObjectId
            status: { $in: ["accepted", "completed", "pending"] }
          }
        },
        {
          $group: {
            _id: "$mentee_id",
            sessionCount: { $sum: 1 }
          }
        },
        {
          $match: {
            sessionCount: { $gt: 1 }
          }
        }
      ]),

      // Goal achieving rate
      ReviewMentor.aggregate([
        { $match: { mentor_id: id } },
        {
          $group: {
            _id: null,
            totalGoalAchieved: { $sum: "$goalAchieved" },
            totalReviews: { $sum: 1 }
          }
        },
        {
          $project: {
            goalAchievingRate: {
              $cond: [
                { $eq: ["$totalReviews", 0] },
                0,
                { $multiply: [{ $divide: ["$totalGoalAchieved", "$totalReviews"] }, 100] }
              ]
            }
          }
        }
      ])
    ]);

    const repeatedUserCount = repeatedUserSessions.length;
    
    const { stripe_account_id, stripeCustomerId, ...rest } = isExistUser;
    rest.isConnected = !!stripe_account_id;

    return {
      ...rest,
      totalSessionCount,
      repeatedUserCount,
      goalAchievingRate: goalAchievingRate[0]?.goalAchievingRate || 0
    };
  }

  return isExistUser;
};



const updateProfileToDB = async (
  user: JwtPayload,
  payload: Partial<IUser>
): Promise<Partial<IUser | null>> => {
  const { id } = user;
  const isExistUser = await User.isExistUserById(id);
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  //unlink file here
  if (payload.image) {
    unlinkFile(isExistUser.image);
  }

  const updateDoc = await User.findOneAndUpdate({ _id: id }, payload, {
    new: true,
  });

  return updateDoc;
};


export const UserService = {
  createUserToDB,
  getUserProfileFromDB,
  updateProfileToDB,
};
