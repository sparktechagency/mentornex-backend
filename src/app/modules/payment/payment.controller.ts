import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import { PaymentService } from './payment.service';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import stripe from '../../../config/stripe';

const createCheckout = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const sessionData = req.body;

  const checkoutSession = await PaymentService.createCheckoutSession(userId, sessionData);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Checkout session created successfully',
    data: checkoutSession,
  });
});

const handleWebhook = catchAsync(async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );

    await PaymentService.handleWebhook(event);
    res.json({ received: true });
  } catch (err) {
    if (err instanceof Error) {
      res.status(400).send(`Webhook Error: ${err.message}`);
    } else {
      res.status(400).send('Webhook Error: Unknown error');
    }
  }
});
export const PaymentController = {
  createCheckout,
  handleWebhook,
};