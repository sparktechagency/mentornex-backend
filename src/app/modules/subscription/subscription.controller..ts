import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import { SubscriptionService } from './subscription.service';
import sendResponse from '../../../shared/sendResponse';
import { PlanType } from '../../../types/subscription.types';
import { stripe, StripeService } from './stripe.service';
import { CreateCheckoutSessionDto } from './subscription.interface';
import { User } from '../user/user.model';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { Subscription } from './subscription.model';
export const SubscriptionController = {
  createCheckoutSession: catchAsync(async (req: Request, res: Response) => {
    const { priceId, productId, planType }: CreateCheckoutSessionDto = req.body;
    const mentorId = req.params.mentor_id;
    const menteeId = req.user.id;

    // Find user to get their stripeCustomerId
    const user = await User.findById(menteeId);
    if (!user?.stripeCustomerId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'User does not have a Stripe customer ID');
    }

    // Validate the pricing plan exists and matches the stripe price
    const subscriptionPlan = await SubscriptionService.validatePricingPlan(
      mentorId,
      priceId
    );

    const successUrl = `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${process.env.FRONTEND_URL}/subscription/cancel`;

    const session = await StripeService.createCheckoutSession(
      user.stripeCustomerId,
      menteeId,
      mentorId,
      priceId,
      planType as PlanType,
      successUrl,
      cancelUrl
    );

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: 'Checkout session created successfully',
      data: { 
        sessionUrl: session.url,
        sessionId: session.id 
      },
    });
  }),

  handleWebhook: catchAsync(async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'] as string;

    const event = await StripeService.handleWebhook(
      signature,
      req.body,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );

    console.log("Stripe Webhook Event Received:", event.type);

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        console.log("Session completed:", {
            metadata: session.metadata,
            subscription: session.subscription
        });
    
        if (session.metadata && session.subscription) {
            // Get the price ID from the line items
            const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
            const stripePriceId = lineItems.data[0].price?.id;
    
            if (!stripePriceId) {
                console.error("Price ID missing in session");
                throw new ApiError(StatusCodes.BAD_REQUEST, 'Price ID not found in session');
            }
    
            // Create subscription with the price ID
            await SubscriptionService.createSubscription(
                session.metadata.menteeId,
                session.metadata.mentorId,
                session.metadata.planType as PlanType,
                stripePriceId, // Pass the price ID here
                typeof session.subscription === 'string' ? session.subscription : session.subscription.id
            );
        }
        break;

        case 'invoice.payment_succeeded':
            const invoice = event.data.object;
            const subscriptionId = invoice.subscription;

            if (subscriptionId) {
                console.log("Payment succeeded, activating subscription:", subscriptionId);
                await SubscriptionService.updateSubscriptionStatus(subscriptionId, "active");
            }
            break;

        case 'customer.subscription.deleted':
            const canceledSubscription = event.data.object;
            await SubscriptionService.updateSubscriptionStatus(canceledSubscription.id, "cancelled");
            break;

        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
}),
};
