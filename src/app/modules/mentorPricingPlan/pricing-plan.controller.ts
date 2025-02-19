import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { PricingPlanService } from './pricing-plan.service';
import { User } from '../user/user.model';

const setupStripeAccount = catchAsync(
  async (req: Request, res: Response) => {
    const mentor_id = req.user.id;
    const { email } = req.user;
    
    const result = await PricingPlanService.setupMentorStripeAccount(mentor_id, email);

    if(!result) {
      sendResponse(res, {
        success: false,
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Stripe account setup failed',
      });
    }

    const updateAccountID = await User.findByIdAndUpdate(mentor_id, {
      stripe_account_id: result.accountId
    });

    if(!updateAccountID) {
      sendResponse(res, {
        success: false,
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Could not update account ID',
      });
    }

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.CREATED,
      message: 'Stripe account setup initiated',
      data: result,
    });
  }
);

const createSubscriptionPlan = catchAsync(
  async (req: Request, res: Response) => {
    const mentor_id = req.user.id;
    const planData = { 
      mentor_id, 
      subscriptions: req.body 
    };
    const result = await PricingPlanService.createSubscriptionPlan(planData);

    if(!result) {
      sendResponse(res, {
        success: false,
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Subscription plan creation failed',
      });
    }

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.CREATED,
      message: 'Subscription plan created successfully',
      data: result,
    });
  }
);

const createPayPerSessionPlan = catchAsync(
  async (req: Request, res: Response) => {
    const mentor_id = req.user.id;
    const planData = { 
      mentor_id, 
      pay_per_sessions: req.body 
    };
    const result = await PricingPlanService.createPayPerSessionPlan(planData);

    if(!result) {
      sendResponse(res, {
        success: false,
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Pay per session plan creation failed',
      });
    }

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.CREATED,
      message: 'Pay per session plan created successfully',
      data: result,
    });
  }
);

const getMentorPricingPlan = catchAsync(
  async (req: Request, res: Response) => {
    const mentor_id = req.params.mentorId;
    const result = await PricingPlanService.getMentorPricingPlan(mentor_id);

    if(!result) {
      sendResponse(res, {
        success: false,
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Pricing plan retrieval failed',
      });
    }

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Pricing plan retrieved successfully',
      data: result,
    });
  }
);

export const PricingPlanController = {
  setupStripeAccount,
  createSubscriptionPlan,
  createPayPerSessionPlan,
  getMentorPricingPlan,
};