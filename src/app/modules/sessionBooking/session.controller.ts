import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { SessionService } from "./session.service";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { paginationHelper } from "../../../helpers/paginationHelper";
import Stripe from "stripe";
import { Session } from "./session.model";
import stripe from "../../../config/stripe";
import dotenv from 'dotenv';
import path from 'path';
import { createZoomMeeting } from "../../../helpers/zoomHelper";
dotenv.config({ path: path.join(process.cwd(), '.env') });
const bookSession = catchAsync(
    async (req: Request, res: Response) => {
      const mentee_id = req.user.id;
      const mentor_id = req.params.mentor_id;
      const sessionData = {mentee_id, mentor_id, ...req.body};
      const result = await SessionService.bookSessionWithPayment(sessionData);
  
      sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Session booked successfully',
        data: result,
      });
    }
  );
  const handleWebhook = async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'] as string;
    
    try {
      const event = await stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET as string
      );
  
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          
          if (session.metadata?.session_id) {
            const sessionRecord = await Session.findById(session.metadata.session_id)
              .populate('mentor_id', 'name email')
              .populate('mentee_id', 'name email') as any;
  
            if (!sessionRecord) {
              console.error('Session record not found');
              break;
            }
  
            if (!sessionRecord.mentor_id || !('email' in sessionRecord.mentor_id) || !('name' in sessionRecord.mentor_id)) {
              console.error('Mentor information not found');
              break;
            }
            if (!sessionRecord.mentee_id || !('email' in sessionRecord.mentee_id) || !('name' in sessionRecord.mentee_id)) {
              console.error('Mentee information not found');
              break;
            }
  
            // Only create Zoom meeting if payment is successful
            if (session.payment_status === 'paid') {
              try {
                const mentorEmail = "apusutradhar77@gmail.com";
              const mentorName = sessionRecord.mentor_id.name;

              const menteeEmail = sessionRecord.mentee_id.email;
              const menteeName = sessionRecord.mentor_id.name;

              const meetingTitle = `Mentoring Session with ${mentorName}`;
              
              const zoomMeetingLink = await createZoomMeeting(
                meetingTitle,
                new Date(sessionRecord.scheduled_time),
                parseInt(sessionRecord.duration),
                mentorEmail,
                menteeEmail
              );
                
                // Update session with payment details and zoom link
                sessionRecord.stripe_payment_intent_id = session.payment_intent as string;
                sessionRecord.payment_status = 'held';
                sessionRecord.zoom_meeting_link = zoomMeetingLink.join_url;
                console.log("Start URL: ",zoomMeetingLink.start_url);
                await sessionRecord.save();
              } catch (error) {
                console.error('Error creating Zoom meeting:', error);
                // Still mark payment as successful but log the Zoom creation error
                sessionRecord.payment_status = 'held';
                sessionRecord.stripe_payment_intent_id = session.payment_intent as string;
                await sessionRecord.save();
              }
            }
          }
          break;
        }
  
        case 'payment_intent.canceled': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          
          // Find and update session with this payment intent
          const sessionRecord = await Session.findOne({
            stripe_payment_intent_id: paymentIntent.id
          });
          
          if (sessionRecord) {
            sessionRecord.status = 'cancelled';
            sessionRecord.payment_status = 'cancelled';
            await sessionRecord.save();
          }
          break;
        }
      }
  
      res.json({ received: true });
    } catch (err: unknown) {
      res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
}; const MenteeUpcomingSession = catchAsync(
    async (req: Request, res: Response) => {
      const mentee_id = req.user.id;
  
      // Get pagination parameters from the request query
      const { page = 1, limit = 10 } = req.query;
  
      // Calculate pagination options using the helper
      const paginationOptions = paginationHelper.calculatePagination({
        page: Number(page),
        limit: Number(limit),
      });
  
      const sessions = await SessionService.getMenteeUpcomingSessions(mentee_id, paginationOptions);
  
      sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Upcoming sessions retrieved successfully',
        data: {
          sessions: sessions.sessions, // The current sessions on this page
          pagination: {
            totalSessions: sessions.totalSessions,
            totalPages: sessions.totalPages,
            currentPage: sessions.currentPage,
            limit: paginationOptions.limit,
          },
        },
      });
    }
  );
  

const MenteeCompletedSession = catchAsync(
    async (req: Request, res: Response) => {
      const mentee_id = req.user.id;
      const sessions = await SessionService.getMenteeCompletedSessions(mentee_id);
      sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Completed sessions retrieved successfully',
        data: sessions,
      });
    }
  );

const MentorRequestedSession = catchAsync(
    async (req: Request, res: Response) => {
      const mentor_id = req.user.id;
      const sessions = await SessionService.getMentorPendingSessions(mentor_id);
  
      sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Pending sessions retrieved successfully',
        data: sessions,
      });
    }
  );

  const MentorAccepetedSession = catchAsync(
    async (req: Request, res: Response) => {
      const mentor_id = req.user.id;
      const sessions = await SessionService.getMentorAcceptedSessions(mentor_id);

      sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Accepted sessions retrieved successfully',
        data: sessions,
      });
    }
  );
  const MentorCompletedSession = catchAsync(
    async (req: Request, res: Response) => {
      const mentor_id = req.user.id;
      const sessions = await SessionService.getMentorCompletedSessions(mentor_id);
      sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Completed sessions retrieved successfully',
        data: sessions,
      });
    }
  );

  const MentorUpdateSessionStatus = catchAsync(
    async (req: Request, res: Response) => {
      const mentor_id = req.user.id;
      const { sessionId, status } = req.body;
  
      const updatedSession = await SessionService.updateSessionStatus(sessionId, mentor_id, status);
  
      sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Session status updated successfully',
        data: updatedSession,
      });
    }
  );
  
  

export const SessionController = { bookSession, MentorRequestedSession, MentorAccepetedSession, MentorCompletedSession, MentorUpdateSessionStatus, MenteeUpcomingSession, MenteeCompletedSession, handleWebhook };