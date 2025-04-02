// import { Request, Response } from 'express';
// import catchAsync from '../../../shared/catchAsync';
// import { SessionService } from './session.service';
// import sendResponse from '../../../shared/sendResponse';
// import { StatusCodes } from 'http-status-codes';
// import { paginationHelper } from '../../../helpers/paginationHelper';

import { Request, Response } from "express"
import catchAsync from "../../../shared/catchAsync"
import { SessionService } from "./session.service";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { PLAN_TYPE } from "../purchase/purchase.interface";
import { Types } from "mongoose";
import pick from "../../../shared/pick";
import { paginationConstants } from "../../../types/pagination";
import { sessionFilterOptions, sessionSearchableFields } from "./session.constants";


// const createSessionPaymentIntent = catchAsync(async (req: Request, res: Response) => {
//   const mentee_id = req.user.id;
//   const mentor_id = req.params.mentor_id;
//   const sessionData = { mentee_id, mentor_id, ...req.body };
  
//   // Create payment intent for the session
//   const result = await SessionService.createPaymentIntent(sessionData);

//   sendResponse(res, {
//     success: true,
//     statusCode: StatusCodes.OK,
//     message: 'Payment intent created successfully',
//     data: result,
//   });
// });

// const MenteeUpcomingSession = catchAsync(
//   async (req: Request, res: Response) => {
//     const mentee_id = req.user.id;

//     // Get pagination parameters from the request query
//     const { page = 1, limit = 10 } = req.query;

//     // Calculate pagination options using the helper
//     const paginationOptions = paginationHelper.calculatePagination({
//       page: Number(page),
//       limit: Number(limit),
//     });

//     const sessions = await SessionService.getMenteeUpcomingSessions(
//       mentee_id,
//       paginationOptions
//     );

//     sendResponse(res, {
//       success: true,
//       statusCode: StatusCodes.OK,
//       message: 'Upcoming sessions retrieved successfully',
//       data: {
//         sessions: sessions.sessions,
//         pagination: {
//           totalSessions: sessions.totalSessions,
//           totalPages: sessions.totalPages,
//           currentPage: sessions.currentPage,
//           limit: paginationOptions.limit,
//         },
//       },
//     });
//   }
// );

// const MenteeCompletedSession = catchAsync(
//   async (req: Request, res: Response) => {
//     const mentee_id = req.user.id;
//     const { page = 1, limit = 10 } = req.query;

//     // Calculate pagination options using the helper
//     const paginationOptions = paginationHelper.calculatePagination({
//       page: Number(page),
//       limit: Number(limit),
//     });
//     const sessions = await SessionService.getMenteeCompletedSessions(mentee_id,paginationOptions);
//     sendResponse(res, {
//       success: true,
//       statusCode: StatusCodes.OK,
//       message: 'Completed sessions retrieved successfully',
//       data: {
//         sessions: sessions.sessions,
//         pagination: {
//           currentPage: sessions.currentPage,
//           limit: paginationOptions.limit,
//         },
//       },
//     });
//   }
// );

// const MentorRequestedSession = catchAsync(
//   async (req: Request, res: Response) => {
//     const mentor_id = req.user.id;
//     const sessions = await SessionService.getMentorPendingSessions(mentor_id);

//     sendResponse(res, {
//       success: true,
//       statusCode: StatusCodes.OK,
//       message: 'Pending sessions retrieved successfully',
//       data: sessions,
//     });
//   }
// );

// const MentorAccepetedSession = catchAsync(
//   async (req: Request, res: Response) => {
//     const mentor_id = req.user.id;
//     const sessions = await SessionService.getMentorAcceptedSessions(mentor_id);

//     sendResponse(res, {
//       success: true,
//       statusCode: StatusCodes.OK,
//       message: 'Accepted sessions retrieved successfully',
//       data: sessions,
//     });
//   }
// );
// const MentorCompletedSession = catchAsync(
//   async (req: Request, res: Response) => {
//     const mentor_id = req.user.id;
//     const sessions = await SessionService.getMentorCompletedSessions(mentor_id);
//     sendResponse(res, {
//       success: true,
//       statusCode: StatusCodes.OK,
//       message: 'Completed sessions retrieved successfully',
//       data: sessions,
//     });
//   }
// );

// const MentorUpdateSessionStatus = catchAsync(
//   async (req: Request, res: Response) => {
//     const mentor_id = req.user.id;
//     const { sessionId, status } = req.body;

//     const updatedSession = await SessionService.updateSessionStatus(
//       sessionId,
//       mentor_id,
//       status
//     );

//     sendResponse(res, {
//       success: true,
//       statusCode: StatusCodes.OK,
//       message: 'Session status updated successfully',
//       data: updatedSession,
//     });
//   }
// );

// export const SessionController = {
//   createSessionPaymentIntent,
//   MentorRequestedSession,
//   MentorAccepetedSession,
//   MentorCompletedSession,
//   MentorUpdateSessionStatus,
//   MenteeUpcomingSession,
//   MenteeCompletedSession
// };


const createSessionRequest = catchAsync(async (req: Request, res: Response) => {
    const { ...payload } = req.body;
    const mentorId = new Types.ObjectId(req.params.mentorId);
    payload.mentor_id = mentorId;
    const result = await SessionService.createSessionRequest(req.user, payload, payload.session_plan_type === PLAN_TYPE.PayPerSession);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Session created successfully',
        data: result,
    });
})

const getSession = catchAsync(async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const result = await SessionService.getSession(req.user, new Types.ObjectId(sessionId));
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Session retrieved successfully',
        data: result,
    });
})

const updateSession = catchAsync(async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const { ...payload } = req.body;
    const result = await SessionService.updateBookedSession(req.user, new Types.ObjectId(sessionId), payload);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Session updated successfully',
        data: result,
    });
})

const getSessionBookingsByUser = catchAsync(async (req: Request, res: Response) => {

    const paginationOptions = pick(req.query, paginationConstants);
    const filterableFields = pick(req.query, sessionFilterOptions);

    const result = await SessionService.getSessionBookingsByUser(req.user, paginationOptions, filterableFields);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Session bookings retrieved successfully',
        data: result,
    });
})

export const SessionController = {
    createSessionRequest,
    getSession,
    updateSession,
    getSessionBookingsByUser
    
}