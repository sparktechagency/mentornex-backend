// import { StatusCodes } from 'http-status-codes';
// import ApiError from '../../../errors/ApiError';
// import { Session } from './session.model';
// import { User } from '../user/user.model';
// import stripe from '../../../config/stripe';
// import { StripeService } from '../purchase/stripe.service';

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
