import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { MentorDashboardService } from "./mentorDashboard.service";
import { IPaginationOptions } from "../../../types/pagination";



const totalCount = catchAsync(
    async (req: Request, res: Response) => {
    const mentor_id = req.user.id;
    const paginationOptions: IPaginationOptions = {
      page: Number(req.query.page || 1),
      limit: Number(req.query.limit || 10),
      sortBy: req.query.sortBy?.toString(),
      sortOrder: req.query.sortOrder?.toString() as 'asc' | 'desc'
    };

    const results = await Promise.all([
      MentorDashboardService.getActiveMenteeService(mentor_id,paginationOptions),
      MentorDashboardService.getTotalSessionCompleted(mentor_id),
      //MentorDashboardService.getMentorBalance(mentor_id)
    ])
  
      sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Received total active mentees successfully',
        data: {
          activeMentees: results[0].mentees,
          totalMenteeCount: results[0].totalMentees,
          count: results[0].count,
          meta: results[0].meta,
          completedSessions: results[1]
        },
      });
    }
  );

  const getMentorBalance = catchAsync(async (req: Request, res: Response) => {
    const mentorId = req.user.id; // Get the logged-in mentor's ID
    const balance = await MentorDashboardService.getMentorBalance(mentorId);
    
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Mentor balance retrieved successfully',
      data: balance,
    });
  });

  /*const sessionCompletedAsSubscripstion = catchAsync(async (req: Request, res: Response) => {
    const mentor_id = req.user.id;
    const results = await MentorDashboardService.sessionCompletedAsSubscripstionFromDB(mentor_id);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Received total active mentees successfully',
      data: results,
    });
  });*/
  const sessionCompletedAsPayPerSession = catchAsync(async (req: Request, res: Response) => {
    const mentor_id = req.user.id;
    const results = await MentorDashboardService.getCompletedPayPerSessionsByMonth(mentor_id);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Received Monthly completed sessions successfully',
      data: results,
    });
  });

export const MentorDashboardController = {
    totalCount,
    getMentorBalance,
    sessionCompletedAsPayPerSession
}