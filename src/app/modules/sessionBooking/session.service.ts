import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiError";

import { Session } from "./session.model";

import stripe from "../../../config/stripe";
import { User } from "../user/user.model";
import { PricingPlan } from "../mentorPricingPlan/pricing-plan.model";
import { createZoomMeeting } from "../../../helpers/zoomHelper";

const bookSessionWithPayment = async (sessionData: any) => {
  try {
    const mentor = await User.findById(sessionData.mentor_id);
    if (!mentor?.stripe_account_id) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Mentor stripe account not found');
    }
    const mentee = await User.findById(sessionData.mentee_id);
    if (!mentee?.stripeCustomerId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Mentee stripe customer not found');
    }

    const pricingPlan = await PricingPlan.findOne({ 
      mentor_id: sessionData.mentor_id,
      $or: [
        { 'subscriptions.stripe_price_id': sessionData.stripe_price_id },
        { 'pay_per_sessions.stripe_price_id': sessionData.stripe_price_id }
      ]
    });

    if (!pricingPlan) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid price ID for this mentor');
    }

    // Find the specific pricing option
    const priceOption = [
      ...(pricingPlan.subscriptions || []),
      ...(pricingPlan.pay_per_sessions || [])
    ].find(option => option.stripe_price_id === sessionData.stripe_price_id);

    if (!priceOption) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Price option not found');
    }

    const platformFee = Math.round(priceOption.amount * 0.1);

    // Create initial session record
    const pendingSession = await Session.create({
      ...sessionData,
      amount: priceOption.amount,
      status: 'pending',
      payment_status: 'pending',
      platform_fee: platformFee,
      payment_type: 'per_session'
    });

    // Create checkout session in platform account
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer: mentee.stripeCustomerId,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: priceOption.amount * 100, // Convert to cents
            product_data: {
              name: `Mentoring Session with ${mentor.name}`,
              description: `30 minutes session`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        session_id: pendingSession._id.toString(),
        mentor_id: sessionData.mentor_id,
        mentee_id: sessionData.mentee_id,
        platform_fee: platformFee,
      },
      success_url: `${process.env.FRONTEND_URL}/sessions/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/sessions/cancel`,
    });

    return {
      sessionId: pendingSession._id,
      checkoutUrl: checkoutSession.url,
    };
  } catch (error) {
    console.error('Error in bookSessionWithPayment:', error);
    throw error;
  }
};

const completeSession = async (sessionId: string) => {
  
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
    status: 'accepted' | 'cancelled' | 'completed'
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

