import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import { SessionService } from './session.service';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { paginationHelper } from '../../../helpers/paginationHelper';
import Stripe from 'stripe';
import { Session } from './session.model';
import stripe from '../../../config/stripe';
import dotenv from 'dotenv';
import path from 'path';
import {
  generateVideoSDKToken,
  setupZoomVideoMeeting
} from '../../../helpers/zoomHelper';
import config from '../../../config';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const bookSession = catchAsync(async (req: Request, res: Response) => {
  const mentee_id = req.user.id;
  const mentor_id = req.params.mentor_id;
  const sessionData = { mentee_id, mentor_id, ...req.body };
  const result = await SessionService.bookSessionWithPayment(sessionData);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Session booked successfully',
    data: result,
  });
});

const getMeetingJoinInfo = async (req: Request, res: Response) => {
  try {
    const meeting_id = req.params.meeting_id;
    const userId = req.user.id;
    
    // Fetch session from database
    const session = await Session.findOne({meeting_id})
      .populate('mentor_id', 'email')
      .populate('mentee_id', 'email');
    
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    
    // Verify this user is authorized to join this meeting
    const isAuthorized = 
      userId === (session.mentor_id as any)._id.toString() || 
      userId === (session.mentee_id as any)._id.toString();
      
    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Not authorized to join this meeting' });
    }
    
    // Determine user role
    const isHost = userId === (session.mentor_id as any)._id.toString();
    const userEmail = isHost ? (session.mentor_id as any).email : (session.mentee_id as any).email;
    
    const token = generateVideoSDKToken(
      session.topic,
      isHost ? 0 : 1,
      userEmail
    );
    
    const joinUrl = `${config.frontend_url}/video-meeting?session=${session.meeting_id}&token=${token}&role=${isHost ? 'host' : 'participant'}`;
    
    return res.json({
      success: true,
      data: {
        joinUrl,
        meetingId: session.meeting_id,
        token,
        role: isHost ? 'host' : 'participant'
      }
    });
  } catch (error) {
    console.error('Error generating meeting join information:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate meeting join information' });
  }
};
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
          const sessionRecord = (await Session.findById(
            session.metadata.session_id
          )
            .populate('mentor_id', 'name email')
            .populate('mentee_id', 'name email')) as any;

          if (!sessionRecord) {
            console.error('Session record not found');
            break;
          }

          if (
            !sessionRecord.mentor_id ||
            !('email' in sessionRecord.mentor_id) ||
            !('name' in sessionRecord.mentor_id)
          ) {
            console.error('Mentor information not found');
            break;
          }
          if (
            !sessionRecord.mentee_id ||
            !('email' in sessionRecord.mentee_id) ||
            !('name' in sessionRecord.mentee_id)
          ) {
            console.error('Mentee information not found');
            break;
          }
          

          if (session.payment_status === 'paid') {
            try {
              const mentorEmail = 'khanrafsan25@gmail.com';
              const mentorName = sessionRecord.mentor_id.name;

              const menteeEmail = 'targariyendaemon@gmail.com';
              //const menteeEmail = sessionRecord.mentee_id.email;
              const menteeName = sessionRecord.mentor_id.name;

              const startTime = new Date(sessionRecord.scheduled_time);

              //const meetingTitle = `Mentoring Session with ${mentorName}`;
              const meetingTitle = `Mentoring Session mentee`;
              const videoMeeting = await setupZoomVideoMeeting(
                mentorEmail,
                menteeEmail,
                meetingTitle
              );
              sessionRecord.meeting_id = videoMeeting.sessionId;
              sessionRecord.stripe_payment_intent_id = session.payment_intent as string;
              sessionRecord.payment_status = 'held';
              sessionRecord.meeting_url = videoMeeting.meeting_url;

              await sessionRecord.save();
            } catch (error) {
              console.error('Error creating Zoom meeting:', error);
              // Still mark payment as successful but log the Zoom creation error
              sessionRecord.payment_status = 'held';
              sessionRecord.stripe_payment_intent_id =
                session.payment_intent as string;
              await sessionRecord.save();
            }
          }
        }
        break;
      }

      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        const sessionRecord = await Session.findOne({
          stripe_payment_intent_id: paymentIntent.id,
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
    res
      .status(400)
      .send(
        `Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
  }
};
const MenteeUpcomingSession = catchAsync(
  async (req: Request, res: Response) => {
    const mentee_id = req.user.id;

    // Get pagination parameters from the request query
    const { page = 1, limit = 10 } = req.query;

    // Calculate pagination options using the helper
    const paginationOptions = paginationHelper.calculatePagination({
      page: Number(page),
      limit: Number(limit),
    });

    const sessions = await SessionService.getMenteeUpcomingSessions(
      mentee_id,
      paginationOptions
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Upcoming sessions retrieved successfully',
      data: {
        sessions: sessions.sessions,
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

    const updatedSession = await SessionService.updateSessionStatus(
      sessionId,
      mentor_id,
      status
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Session status updated successfully',
      data: updatedSession,
    });
  }
);

export const SessionController = {
  bookSession,
  getMeetingJoinInfo,
  MentorRequestedSession,
  MentorAccepetedSession,
  MentorCompletedSession,
  MentorUpdateSessionStatus,
  MenteeUpcomingSession,
  MenteeCompletedSession,
  handleWebhook,
};
