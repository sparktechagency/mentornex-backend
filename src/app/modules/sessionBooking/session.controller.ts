import { NextFunction, Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { SessionService } from "./session.service";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";


const bookSession = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const mentee_id = req.user.id;
      const sessionData = {mentee_id, ...req.body};
      const result = await SessionService.bookSessionToDB(sessionData);
  
      sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Session booked successfully',
        data: result,
      });
    }
  );

const MenteeUpcomingSession = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const mentee_id = req.user.id;
      const sessions = await SessionService.getMenteeUpcomingSessions(mentee_id);
      sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Upcoming sessions retrieved successfully',
        data: sessions,
      });
    }
  );

const MenteeCompletedSession = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
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
    async (req: Request, res: Response, next: NextFunction) => {
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
    async (req: Request, res: Response, next: NextFunction) => {
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
    async (req: Request, res: Response, next: NextFunction) => {
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
  

export const SessionController = { bookSession, MentorRequestedSession, MentorAccepetedSession, MentorCompletedSession, MenteeUpcomingSession, MenteeCompletedSession };