import { NextFunction, Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { UserService } from "../user/user.service";
import { MenteeDashboardService } from "./menteeDashboard.service";



const totalCount = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
    const mentee_id = req.user.id;
    const totalActiveMentors = await MenteeDashboardService.getActiveMentorCountService();
    const completedSession = await MenteeDashboardService.getTotalSessionCompleted(mentee_id);
    const activeMentorsList = await MenteeDashboardService.getActiveMentorsList();

    const result = {
        totalActiveMentors: totalActiveMentors,
        completedSession: completedSession,
        activeMentorsList: activeMentorsList
    }
  
      sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Received total active mentors successfully',
        data: result,
      });
    }
  );


export const MenteeDashboardController = {
    totalCount
}