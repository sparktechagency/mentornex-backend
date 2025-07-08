import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { MenteeDashboardService } from './menteeDashboard.service';

const totalCount = catchAsync(async (req: Request, res: Response) => {
  const mentee_id = req.user.id;

  const results = Promise.all([
    MenteeDashboardService.getActiveMentorCountService(),
    MenteeDashboardService.getTotalSessionCompleted(mentee_id),
    MenteeDashboardService.getActiveMentorsList(),
  ]);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Received total active mentors successfully',
    data: results,
  });
});

const getPremiumContent = catchAsync(async (req: Request, res: Response) => {
  const mentee_id = req.user.id;

  const results = await MenteeDashboardService.getPremiumContents(mentee_id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Received premium content successfully',
    data: results,
  });
});

const getMenteesMentorList = catchAsync(async (req: Request, res: Response) => {
  const results = await MenteeDashboardService.getMenteesMentorList(req.user!);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Received active mentors list successfully',
    data: results,
  });
});

const generalMenteeDahsboardStatistics = catchAsync(
  async (req: Request, res: Response) => {
    const result = await MenteeDashboardService.getGeneralMenteeStat(req.user!);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Received general mentee dashboard statistics successfully',
      data: result,
    });
  }
);

export const MenteeDashboardController = {
  totalCount,
  getPremiumContent,
  getMenteesMentorList,
  generalMenteeDahsboardStatistics,
};
