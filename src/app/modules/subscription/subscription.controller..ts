import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import { SubscriptionService } from './subscription.service';
import sendResponse from '../../../shared/sendResponse';
import { PlanType } from '../../../types/subscription.types';
export const SubscriptionController = {
  createSubscription: catchAsync(async (req: Request, res: Response) => {
    const { planType, stripePriceId } = req.body;
    const mentor_id = req.params.id;
    const menteeId = req.user.id;

    const result = await SubscriptionService.createSubscription(
      menteeId,
      mentor_id,
      planType as PlanType,
      stripePriceId
    );

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: 'Subscription created successfully',
      data: result,
    });
  }),
};
