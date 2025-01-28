import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { Payment } from './payment.model';
import stripe from '../../../config/stripe';
import { SessionService } from '../sessionBooking/session.service';

const createCheckoutSession = async (
  userId: string,
  sessionData: {
    mentor_id: string;
    date_time: string;
    topic: string;
    duration: string;
    expected_outcome: string;
    fee: number;
  }
) => {
  try {
    // Validate fee and convert to cents
    if (!sessionData.fee || sessionData.fee <= 0) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid fee amount');
    }
    const amountInCents = Math.round(sessionData.fee * 100);

    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Mentoring Session: ${sessionData.topic}`,
              description: `${sessionData.duration} mentoring session`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      // Using Stripe's test success and cancel URLs
      success_url: 'https://stripe.com/success',
      cancel_url: 'https://stripe.com/cancel',
      metadata: {
        userId,
        sessionData: JSON.stringify(sessionData),
      },
    });

    // Create pending payment record
    await Payment.create({
      userId,
      amount: sessionData.fee,
      status: 'pending',
      stripeSessionId: stripeSession.id,
      sessionId: stripeSession.id,
    });

    return {
      checkoutUrl: stripeSession.url,
      sessionId: stripeSession.id
    };

  } catch (error: unknown) {
    console.error('Stripe checkout error:', error);
    if (error instanceof Error) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `Failed to create checkout session: ${error.message}`
      );
    } else {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Failed to create checkout session: Unknown error'
      );
    }
  }
};
const handleWebhook = async (event: any) => {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const { userId, sessionData } = session.metadata;
      const parsedSessionData = JSON.parse(sessionData);

      // Update payment status
      await Payment.findOneAndUpdate(
        { stripeSessionId: session.id },
        { status: 'completed' }
      );

      // Create session booking
      await SessionService.bookSessionToDB({
        mentee_id: userId,
        ...parsedSessionData,
        payment_status: true,
      });

      break;
    }
    case 'checkout.session.expired': {
      await Payment.findOneAndUpdate(
        { stripeSessionId: event.data.object.id },
        { status: 'failed' }
      );
      break;
    }
  }
};

export const PaymentService = {
  createCheckoutSession,
  handleWebhook,
};