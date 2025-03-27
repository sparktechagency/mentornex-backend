// import { StatusCodes } from 'http-status-codes';
// import ApiError from '../../../errors/ApiError';
// import { Session } from './session.model';
// import { User } from '../user/user.model';
// import stripe from '../../../config/stripe';
// import { StripeService } from '../purchase/stripe.service';

import { JwtPayload } from "jsonwebtoken"
import { ISession, SESSION_STATUS } from "./session.interface"
import { User } from "../user/user.model"
import ApiError from "../../../errors/ApiError"
import { StatusCodes } from "http-status-codes"
import { convertSessionTimeToLocal, convertSessionTimeToUTC, convertSlotTimeToUTC } from "../../../helpers/date.helper"
import { DateTime } from "luxon"
import { Session } from "./session.model"
import mongoose, { Types } from "mongoose"
import sendNotification from "../../../helpers/sendNotificationHelper"
import { getActivePackageOrSubscription } from "./session.utils"

// const createPaymentIntent = async (sessionData: any) => {
//   try {
//     const mentor = await User.findById(sessionData.mentor_id);

//     if (!mentor) {
//       throw new ApiError(StatusCodes.BAD_REQUEST, 'Mentor not found');
//     }

//     const mentee = await User.findById(sessionData.mentee_id);

//     if (!mentee) {
//       throw new ApiError(StatusCodes.BAD_REQUEST, 'Mentee not found');
//     }

//     // Find pricing plan containing the selected session
//     const pricingPlan = await PricingPlan.findOne({
//       mentor_id: sessionData.mentor_id,
//     });

//     if (!pricingPlan) {
//       throw new ApiError(
//         StatusCodes.BAD_REQUEST,
//         'Pricing plan not found for this mentor'
//       );
//     }

//     if(!pricingPlan.pay_per_sessions) {
//       throw new ApiError(
//         StatusCodes.BAD_REQUEST,
//         'Pricing plan does not have pay-per-session options'
//       );
//     }

//     // Find the specific pay-per-session option based on provided criteria (duration, type, etc.)
//     const sessionPlan = pricingPlan.pay_per_sessions.find(
//       option => option.stripe_price_id === sessionData.stripe_price_id
//     );

//     if (!sessionPlan) {
//       throw new ApiError(
//         StatusCodes.BAD_REQUEST,
//         'Requested session type not found'
//       );
//     }

//     // Create a temporary session record to link with the payment
//     const tempSession = await Session.create({
//       mentor_id: sessionData.mentor_id,
//       mentee_id: sessionData.mentee_id,
//       scheduled_time: new Date(sessionData.scheduled_time),
//       topic: sessionData.topic,
//       duration: sessionData.duration,
//       expected_outcome: sessionData.expected_outcome,
//       session_type: sessionData.session_type || 'one-on-one',
//       amount: sessionPlan.amount,
//       platform_fee: Math.round(sessionPlan.amount * 0.1),
//       payment_type: 'per_session',
//       status: 'pending',
//       payment_status: 'pending',
//     });

//     // Create a payment intent
//     const paymentIntent = await stripe.paymentIntents.create({
//       amount: sessionPlan.amount * 100, // Convert to cents
//       currency: 'usd',
//       metadata: {
//         session_id: tempSession._id.toString(),
//         mentor_id: sessionData.mentor_id,
//         mentee_id: sessionData.mentee_id,
//         scheduled_time: sessionData.scheduled_time,
//         topic: sessionData.topic,
//         duration: sessionData.duration,
//         expected_outcome: sessionData.expected_outcome,
//         session_type: sessionData.session_type || 'one-on-one',
//       },
//     });

//     // Update the session with the payment intent ID
//     tempSession.stripe_payment_intent_id = paymentIntent.id;
//     await tempSession.save();

//     return {
//       clientSecret: paymentIntent.client_secret,
//       sessionId: tempSession._id,
//       sessionDetails: {
//         amount: sessionPlan.amount,
//         duration: sessionPlan.duration,
//         title: sessionPlan.title,
//       },
//     };
//   } catch (error) {
//     console.error('Error in createPaymentIntent:', error);
//     throw error;
//   }
// };

// // This method will be called from the webhook handler after successful payment
// const createSessionFromPayment = async (paymentData: any) => {
//   try {
//     const {
//       mentor_id,
//       mentee_id,
//       scheduled_time,
//       topic,
//       duration,
//       expected_outcome,
//       session_type,
//       amount,
//       stripe_payment_intent_id,
//     } = paymentData;

//     const platformFee = Math.round(amount * 0.1);

//     // Create session record
//     const session = await Session.create({
//       mentor_id,
//       mentee_id,
//       scheduled_time: new Date(scheduled_time),
//       topic,
//       duration,
//       expected_outcome,
//       session_type: session_type || 'pay_per_sessions',
//       amount,
//       platform_fee: platformFee,
//       payment_type: 'per_session',
//       status: 'accepted',
//       payment_status: 'held',
//       stripe_payment_intent_id,
//     });

//     // Create Zoom meeting for the session
//     try {
//       const mentor = await User.findById(mentor_id).select('email name');
//       const mentee = await User.findById(mentee_id).select('email name');

//       if (mentor && mentee) {
//         const {
//           setupZoomVideoMeeting,
//         } = require('../../../helpers/zoomHelper');

//         const meetingTitle = `Mentoring Session: ${topic}`;
//         const videoMeeting = await setupZoomVideoMeeting(
//           mentor.email,
//           mentee.email,
//           meetingTitle
//         );

//         session.meeting_id = videoMeeting.sessionId;
//         session.meeting_url = videoMeeting.meeting_url;
//         await session.save();
//       }
//     } catch (zoomError) {
//       console.error('Error creating Zoom meeting:', zoomError);
//       // Continue without failing the session creation
//     }

//     return session;
//   } catch (error) {
//     console.error('Error creating session from payment:', error);
//     throw error;
//   }
// };

// const completeSession = async (sessionId: string) => {};

// const getMenteeUpcomingSessions = async (
//   mentee_id: string,
//   paginationOptions: any
// ) => {
//   const currentDate = new Date();
//   const { skip, limit, sortBy, sortOrder } = paginationOptions;
//   // Query sessions with pagination
//   const sessions = await Session.find({
//     mentee_id,
//     status: { $in: ['pending', 'accepted', 'rejected'] },
//     date_time: { $gt: currentDate },
//   })
//     .populate({
//       path: 'mentee_id',
//       select: 'name',
//     })
//     .sort({ [sortBy]: sortOrder }) // Sort the sessions by the given sort order
//     .skip(skip) // Skip to the right page
//     .limit(limit) // Limit to the number of sessions per page
//     .exec();
//   // Get total count of sessions for pagination metadata
//   const totalSessions = await Session.countDocuments({
//     mentee_id,
//     status: { $in: ['pending', 'accepted', 'rejected'] },
//     date_time: { $gt: currentDate },
//   });

//   if (!sessions || sessions.length === 0) {
//     throw new ApiError(StatusCodes.NOT_FOUND, 'No upcoming sessions found');
//   }
//   return {
//     sessions,
//     totalSessions,
//     totalPages: Math.ceil(totalSessions / limit), // Calculate total pages
//     currentPage: paginationOptions.page,
//   };
// };

// const getMenteeCompletedSessions = async (
//   mentee_id: string,
//   paginationOptions: any
// ) => {
//   const { skip, limit, sortBy, sortOrder } = paginationOptions;
//   const sessions = await Session.find({
//     mentee_id,
//     status: { $in: ['completed', 'rejected'] },
//   })

//     .populate({
//       path: 'mentee_id',
//       select: 'name',
//     })
//     .populate({
//       path: 'mentee_id',
//       select: 'name',
//     })
//     .sort({ [sortBy]: sortOrder }) // Sort the sessions by the given sort order
//     .skip(skip) // Skip to the right page
//     .limit(limit) // Limit to the number of sessions per page
//     .exec();

//   if (!sessions || sessions.length === 0) {
//     throw new ApiError(StatusCodes.NOT_FOUND, 'No completed sessions found');
//   }

//   return { sessions, currentPage: paginationOptions.page };
// };

// const getMentorPendingSessions = async (mentor_id: string) => {
//   const sessions = await Session.find({ mentor_id, status: 'pending' })
//     .populate({
//       path: 'mentee_id',
//       select: 'name',
//     })
//     .exec();

//   if (!sessions || sessions.length === 0) {
//     throw new ApiError(StatusCodes.NOT_FOUND, 'No pending sessions found');
//   }

//   return sessions;
// };
// const getMentorAcceptedSessions = async (mentor_id: string) => {
//   const sessions = await Session.find({ mentor_id, status: 'accepted' })
//     .populate({
//       path: 'mentee_id',
//       select: 'name',
//     })
//     .exec();

//   if (!sessions || sessions.length === 0) {
//     throw new ApiError(StatusCodes.NOT_FOUND, 'No upcoming sessions found');
//   }

//   return sessions;
// };

// const getMentorCompletedSessions = async (mentor_id: string) => {
//   const sessions = await Session.find({ mentor_id, status: 'completed' })
//     .populate({
//       path: 'mentee_id',
//       select: 'name',
//     })
//     .exec();

//   if (!sessions || sessions.length === 0) {
//     throw new ApiError(StatusCodes.NOT_FOUND, 'No completed sessions found');
//   }

//   return sessions;
// };

// const updateSessionStatus = async (
//   sessionId: string,
//   mentor_id: string,
//   status: 'accepted' | 'cancelled' | 'completed'
// ) => {
//   const session = await Session.findOne({
//     _id: sessionId,
//     mentor_id,
//     status: 'pending',
//   });

//   if (!session) {
//     throw new ApiError(
//       StatusCodes.NOT_FOUND,
//       'Session not found or already updated'
//     );
//   }

//   session.status = status;
//   await session.save();

//   return session;
// };

// export const SessionService = {
//   createPaymentIntent,
//   getMentorPendingSessions,
//   getMentorAcceptedSessions,
//   getMentorCompletedSessions,
//   getMenteeUpcomingSessions,
//   getMenteeCompletedSessions,
//   updateSessionStatus,
//   completeSession,
// };


const createSessionRequest = async (
    user: JwtPayload,
    payload: ISession & { slot: string, date: string },
    payPerSession?: boolean
) => {
   
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        
        const isUserExist = await User.findById(user.id).lean();
        if (!isUserExist || isUserExist.status !== 'active') {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'You are not authorized to purchase this session.');
        }

        // Convert slot to UTC with proper date reference
        const convertedSlot = convertSessionTimeToUTC(payload.slot, isUserExist.timeZone, payload.date);
        const convertedDate = new Date(convertedSlot.isoString);

        //now see if the requested slot is available or not



        // if (isSlotAvailable) {
        //     throw new ApiError(StatusCodes.BAD_REQUEST, 'The requested slot is not available.');
        // }
        
        const { pkg, subscription } = await getActivePackageOrSubscription(isUserExist._id);
    
        if(pkg && payload.package_id){
            payload.package_id = pkg.package_id;
        }
        if(subscription && payload.subscription_id){
            payload.subscription_id = subscription.subscription_id;
        }
    

        const sessionData = {
            mentor_id: payload.mentor_id,
            mentee_id: user.id,
            scheduled_time: convertedDate,
            topic: payload.topic,
            duration: payload.duration,
            expected_outcome: payload.expected_outcome,
            session_plan_type: payload.session_plan_type,
            status: SESSION_STATUS.PENDING,
            ...(payPerSession && { pay_per_session_id: payload.pay_per_session_id }),
            ...(payload.package_id && { package_id: payload.package_id }),
            ...(payload.subscription_id && { subscription_id: payload.subscription_id })
        };
    
    
    
    
        const bookedSession = await Session.create([sessionData], { session });
    
        await sendNotification('getNotification',{
            senderId: user.id.toString(),
            receiverId: payload.mentor_id.toString(),
            title: `You have a new session request from ${isUserExist.name}`,
            message: `You have a new session request from ${isUserExist.name} at ${payload.date} ${payload.slot} on ${payload.topic}, please respond to accept or reject `,
        })
    
        await session.commitTransaction();

        return bookedSession;
    } catch (error) {
        console.error('Error creating session request:', error);
        await session.abortTransaction();

        throw error;
    } finally {
        await session.endSession();
    }
};


const updateBookedSession = async (user: JwtPayload, sessionId: Types.ObjectId, payload: ISession & { slot: string, date: string }) => {
    const isUserExist = await User.findById(user.id).lean();
    if (!isUserExist || isUserExist.status !== 'active') {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'You are not authorized to access this session.');
    }

    const session = await Session.findById(sessionId).populate<{mentee_id: {name: string, timeZone: string, _id: Types.ObjectId}}>('mentee_id', 'name timeZone _id').populate<{mentor_id: {name: string, timeZone: string, _id: Types.ObjectId}}>('mentor_id', 'name timeZone _id');
    if (!session || session.mentee_id._id.toString() !== user.id || session.mentor_id._id.toString() !== user.id) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'You are not authorized to access this session.');
    }

    const generateNotificationData = (sender: string, receiver: string, status: SESSION_STATUS, topic: string,date:Date,  timeZone: string, message?: string)=>{
        return {
            senderId: sender,
            receiverId: receiver,
            title: `Your session request has been ${status} by ${session.mentee_id.name}`,
            message: `Your session request has been ${status} by ${session.mentee_id.name} at ${convertSessionTimeToLocal(date, timeZone)} on ${topic}. ${message && 'Cancellation reason: ' + message}`,
        }
    }

    if(payload.status === SESSION_STATUS.ACCEPTED){
        session.status = payload.status;
        await session.save();
        await sendNotification('getNotification', generateNotificationData(user.id.toString(), session.mentee_id._id.toString(), SESSION_STATUS.ACCEPTED, session.topic, session.scheduled_time, session.mentee_id.timeZone));
    }

    if(payload.status === SESSION_STATUS.CANCELLED){
        session.status = payload.status;
        session.cancel_reason = payload.cancel_reason;
        await session.save();
        await sendNotification('getNotification', generateNotificationData(user.id.toString(), session.mentee_id._id.toString(), SESSION_STATUS.CANCELLED, session.topic, session.scheduled_time, session.mentee_id.timeZone, payload.cancel_reason));
    }

    if(payload.status === SESSION_STATUS.RESCHEDULED && !(session.status === SESSION_STATUS.CANCELLED || session.status === SESSION_STATUS.ACCEPTED)){
       throw new ApiError(StatusCodes.BAD_REQUEST, 'Only cancelled or accepted sessions can be rescheduled.');
    }

    if(payload.status === SESSION_STATUS.RESCHEDULED && (session.status === SESSION_STATUS.CANCELLED  || session.status === SESSION_STATUS.ACCEPTED)){
        if(user.id !== session.mentee_id.toString() && user.id !== session.mentor_id.toString()){
            throw new ApiError(StatusCodes.BAD_REQUEST, 'You are not authorized to reschedule this session.');
        }
        if(payload.date && payload.slot){
            session.status = payload.status;
            const convertedSlot = convertSessionTimeToUTC(payload.slot, isUserExist.timeZone, payload.date);
            const convertedDate = new Date(convertedSlot.isoString);
            session.scheduled_time = convertedDate;
            await session.save();
            await sendNotification('getNotification', generateNotificationData(user.id.toString(), session.mentee_id._id.toString(), SESSION_STATUS.RESCHEDULED, session.topic, session.scheduled_time, session.mentee_id.timeZone));
        }else{
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Date and slot are required to reschedule the session.');
        }
    }

    return session;
};

const getSession = async (user: JwtPayload, sessionId: Types.ObjectId) => {
    const isUserExist = await User.findById(user.id).lean();
    if (!isUserExist || isUserExist.status !== 'active') {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'You are not authorized to access this session.');
    }

    const session = await Session.findById(sessionId).lean();
    if (!session) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Session not found');
    }

    const displayTime = convertSessionTimeToLocal(session.scheduled_time, isUserExist.timeZone);
   

    return { 
        ...session, 
        scheduled_time: displayTime 
    };
};

export const SessionService = {
    createSessionRequest,
    getSession
}