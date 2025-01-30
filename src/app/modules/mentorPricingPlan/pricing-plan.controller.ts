import { Request, Response, NextFunction } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { PricingPlanService } from './pricing-plan.service';

const createSubscriptionPlan = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const mentor_id = req.user.id;
    const planData = { mentor_id, ...req.body };
    const result = await PricingPlanService.createSubscriptionPlan(planData);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.CREATED,
      message: 'Subscription plans created successfully',
      data: result,
    });
  }
);
const createPayPerSessionPlan = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const mentor_id = req.user.id;
    const planData = { mentor_id, ...req.body };
    const result = await PricingPlanService.createPayPerSessionPlan(planData);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.CREATED,
      message: 'Pay per session plan created successfully',
      data: result,
    });
  }
);
const getMentorPricingPlan = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const mentor_id = req.params.mentorId;
    const result = await PricingPlanService.getMentorPricingPlan(mentor_id);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Pricing plan retrieved successfully',
      data: result,
    });
  }
);
export const PricingPlanController = {
  createSubscriptionPlan,
  createPayPerSessionPlan,
  getMentorPricingPlan,
};
