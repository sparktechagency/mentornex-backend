import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { DashboardService } from './dashboard.service';
import { StatusCodes } from 'http-status-codes';

const getSessionRateData = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const year = parseInt(req.query.year as string) || new Date().getFullYear();

  const result = await DashboardService.getSessionRateData(user, year);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Session rate data retrieved successfully',
    data: result,
  });
});

const getEarningData = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const year = parseInt(req.query.year as string) || new Date().getFullYear();

  const result = await DashboardService.getEarningData(user, year);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Earning data retrieved successfully',
    data: result,
  });
});

const getMentorGeneralStats = catchAsync(
  async (req: Request, res: Response) => {
    const result = await DashboardService.getMentorGeneralStats(req.user);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Mentor general stats retrieved successfully',
      data: result,
    });
  }
);

export const DashboardController = {
  getSessionRateData,
  getEarningData,
};
