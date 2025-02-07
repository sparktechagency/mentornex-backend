import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiError";
import { ISession } from "./session.interface";
import { Session } from "./session.model";
import { SubscriptionService } from "../subscription/subscription.service";
import { StripeService } from "../subscription/stripe.service";



const bookSessionWithPayment = async (sessionData: any) => {
  //const platformFee = calculatePlatformFee(sessionData.amount);

  /*const platformFee = (sessionData.amount * 10) / 100;
  
  if (sessionData.payment_type === 'subscription') {
    const hasAvailableSessions = await SubscriptionService.checkSessionsAvailable(
      sessionData.subscription_id
    );
    
    if (!hasAvailableSessions) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'No sessions remaining in subscription');
    }
  } else {
    // Create payment intent for pay-per-session
    const paymentIntent = await StripeService.createPaymentIntent(
      sessionData.amount,
      sessionData.mentee_id,
      sessionData.mentor_id,
      sessionData._id
    );
    sessionData.stripe_payment_intent_id = paymentIntent.id;
  }

  const session = await Session.create({
    ...sessionData,
    payment_type: sessionData.payment_type,
    platform_fee: platformFee,
  });

  if (sessionData.payment_type === 'subscription') {
    await SubscriptionService.deductSession(sessionData.subscription_id);
  }

  return session;*/
};

const completeSession = async (sessionId: string) => {
  /*const session = await Session.findById(sessionId);
  if (!session) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Session not found');
  }

  if (session.payment_type === 'per_session') {
    await StripeService.capturePayment(session.stripe_payment_intent_id);
  }

  session.status = 'completed';
  session.payment_status = 'released';
  await session.save();

  return session;*/
};

  const getMenteeUpcomingSessions = async (mentee_id: string, paginationOptions: any) => {
    const currentDate = new Date();
    const { skip, limit, sortBy, sortOrder } = paginationOptions;
    // Query sessions with pagination
    const sessions = await Session.find({ 
      mentee_id, 
      status: { $in: ['pending', 'accepted', 'rejected'] },
      date_time: { $gt: currentDate }
    })
    .populate({
      path: 'mentee_id',
      select: 'name',
    })
    .sort({ [sortBy]: sortOrder }) // Sort the sessions by the given sort order
    .skip(skip) // Skip to the right page
    .limit(limit) // Limit to the number of sessions per page
    .exec();
    // Get total count of sessions for pagination metadata
    const totalSessions = await Session.countDocuments({
      mentee_id,
      status: { $in: ['pending', 'accepted', 'rejected'] },
      date_time: { $gt: currentDate }
    });
  
    if (!sessions || sessions.length === 0) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'No upcoming sessions found');
    }
    return {
      sessions,
      totalSessions,
      totalPages: Math.ceil(totalSessions / limit), // Calculate total pages
      currentPage: paginationOptions.page,
    };
  };
  
const getMenteeCompletedSessions = async (mentee_id: string) => {
    const sessions = await Session.find({ mentee_id, status: { $in: ['completed', 'rejected'] } })
      .populate({
        path: 'mentee_id',
        select: 'name',
      })
      .exec();
  
    if (!sessions || sessions.length === 0) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'No completed sessions found');
    }
  
    return sessions;
  };

const getMentorPendingSessions = async (mentor_id: string) => {
    const sessions = await Session.find({ mentor_id, status: 'pending' })
      .populate({
        path: 'mentee_id',
        select: 'name',
      })
      .exec();
  
    if (!sessions || sessions.length === 0) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'No pending sessions found');
    }
  
    return sessions;
  };
const getMentorAcceptedSessions = async (mentor_id: string) => {
    const sessions = await Session.find({ mentor_id, status: 'accepted' })
      .populate({
        path: 'mentee_id',
        select: 'name',
      })
      .exec();
  
    if (!sessions || sessions.length === 0) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'No upcoming sessions found');
    }
  
    return sessions;
  };

  const getMentorCompletedSessions = async (mentor_id: string) => {
    const sessions = await Session.find({ mentor_id, status: 'completed' })
      .populate({
        path: 'mentee_id',
        select: 'name',
      })
      .exec();

    if (!sessions || sessions.length === 0) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'No completed sessions found');
    }

    return sessions;
  };

  const updateSessionStatus = async (
    sessionId: string,
    mentor_id: string,
    status: 'accepted' | 'rejected'
  ) => {
    const session = await Session.findOne({ _id: sessionId, mentor_id, status: 'pending' });
  
    if (!session) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Session not found or already updated');
    }
  
    session.status = status;
    await session.save();
  
    return session;
  };
  

export const SessionService = {
    bookSessionWithPayment,
    getMentorPendingSessions,
    getMentorAcceptedSessions,
    getMentorCompletedSessions,
    getMenteeUpcomingSessions,
    getMenteeCompletedSessions,
    updateSessionStatus,
    completeSession
};

