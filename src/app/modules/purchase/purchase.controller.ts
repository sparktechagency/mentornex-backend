import { Request, Response, NextFunction } from 'express';
import { PurchaseServices } from './purchase.service';
import catchAsync from '../../../shared/catchAsync';
import { Types } from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import sendResponse from '../../../shared/sendResponse';

const purchasePayPerSession = catchAsync(async(req: Request, res: Response) => {
  const payload = req.body;
  const result = await PurchaseServices.purchasePayPerSession(req.user, new Types.ObjectId(req.params.id), payload);
 sendResponse(res, {
  success: true,
  statusCode: StatusCodes.OK,
  message: 'Purchase created successfully',
  data: result
})
})

const purchasePackage = catchAsync(async(req: Request, res: Response) => {

  const result = await PurchaseServices.purchasePackage(req.user, new Types.ObjectId(req.params.id));
 sendResponse(res, {
  success: true,
  statusCode: StatusCodes.OK,
  message: 'Purchase created successfully',
  data: result
})
})


const purchaseSubscription = catchAsync(async(req: Request, res: Response) => {
 
  const result = await PurchaseServices.purchaseSubscription(req.user, new Types.ObjectId(req.params.id));
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Purchase created successfully',
    data: result
  })
})

const cancelSubscription = catchAsync(async(req: Request, res: Response) => {
  const result = await PurchaseServices.cancelSubscription(req.user, new Types.ObjectId(req.params.id));
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Subscription cancelled successfully',
    data: result
  })
})



export const PurchaseController = { 
  purchasePayPerSession,
  purchasePackage,
  purchaseSubscription,
  cancelSubscription
 };
