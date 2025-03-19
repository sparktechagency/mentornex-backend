import { Request, Response, NextFunction } from 'express';
import { PlansServices } from './plans.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';

const createPayPerSession = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const user = req.user;
  const result = await PlansServices.createPayPerSession(payload, user);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Pay per session created successfully',
    data: result,
  });
});

const updatePayPerSession = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const user = req.user;
  const result = await PlansServices.updatePayPerSession(new Types.ObjectId(req.params.id), payload, user);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Pay per session updated successfully',
    data: result,
  });
});

const deletePayPerSession = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const result = await PlansServices.deletePayPerSession(new Types.ObjectId(req.params.id), user);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Pay per session deleted successfully',
    data: result,
  });
});

const createPackage = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const user = req.user;
  const result = await PlansServices.createPackage(payload, user);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Package created successfully',
    data: result,
  });
});

const updatePackage = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const user = req.user;
  const result = await PlansServices.updatePackage(new Types.ObjectId(req.params.id), payload, user);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Package updated successfully',
    data: result,
  });
});

const deletePackage = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const result = await PlansServices.deletePackage(new Types.ObjectId(req.params.id), user);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Package deleted successfully',
    data: result,
  });
});

const createSubscriptionPlan = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const user = req.user;
  const result = await PlansServices.createSubscriptionPlan(payload, user);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Subscription plan created successfully',
    data: result,
  });
});

const updateSubscriptionPlan = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const user = req.user;
  const result = await PlansServices.updateSubscriptionPlan(new Types.ObjectId(req.params.id), payload, user);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Subscription plan updated successfully',
    data: result,
  });
});

const deleteSubscriptionPlan = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const result = await PlansServices.deleteSubscriptionPlan(new Types.ObjectId(req.params.id), user);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Subscription plan deleted successfully',
    data: result,
  });
});

const getPricingPlans = catchAsync(async (req: Request, res: Response) => {
  const result = await PlansServices.getPricingPlans(new Types.ObjectId(req.params.id));
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Pricing plans retrieved successfully',
    data: result,
  });
});

export const PlansController = { 
  createPayPerSession,
  updatePayPerSession,
  deletePayPerSession,
  createPackage,
  updatePackage,
  deletePackage,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  getPricingPlans
};
