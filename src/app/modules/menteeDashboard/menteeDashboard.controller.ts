import { NextFunction, Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { UserService } from "../user/user.service";
import { MenteeDashboardService } from "./menteeDashboard.service";



const totalCount = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
    const mentee_id = req.user.id;

    const results = Promise.all([
      MenteeDashboardService.getActiveMentorCountService(),
      MenteeDashboardService.getTotalSessionCompleted(mentee_id),
      MenteeDashboardService.getActiveMentorsList()
    ])
  
      sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Received total active mentors successfully',
        data: results,
      });
    }
  );


export const MenteeDashboardController = {
    totalCount
}