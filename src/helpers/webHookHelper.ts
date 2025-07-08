import { Request, Response } from 'express';
import Stripe from 'stripe';
import stripe from '../config/stripe';
import { Purchase } from '../app/modules/purchase/purchase.model';

import {
  PAYMENT_STATUS,
  PLAN_TYPE,
  PURCHASE_PLAN_STATUS,
} from '../app/modules/purchase/purchase.interface';
import { Session } from '../app/modules/sessionBooking/session.model';
import { Types } from 'mongoose';
import { PaymentRecord } from '../app/modules/payment-record/payment-record.model';
import { User } from '../app/modules/user/user.model';
import { emailHelper } from './emailHelper';
import { emailTemplate } from '../shared/emailTemplate';

/**
 * Creates a payment record in the database
 * @param menteeId - ID of the mentee
 * @param mentorId - ID of the mentor
 * @param amount - Payment amount
 * @param planType - Type of plan (Subscription, Package, PayPerSession)
 * @param referenceId - ID of the related entity (subscription, package, session)
 * @param invoiceId - Stripe invoice ID
 * @param application_fee - Stripe invoice ID
 */
const createPaymentRecord = async (
  menteeId: Types.ObjectId,
  mentorId: Types.ObjectId,
  amount: number,
  planType: PLAN_TYPE,
  referenceId: Types.ObjectId,
  invoiceId: string,
  application_fee: number
) => {
  try {
    // Create payment record
    await PaymentRecord.create({
      mentee_id: menteeId,
      mentor_id: mentorId,
      amount,
      plan_type: planType,
      ...(planType === PLAN_TYPE.PayPerSession
        ? { pay_per_session_id: referenceId }
        : PLAN_TYPE.Subscription
        ? { subscription_id: referenceId }
        : { package_id: referenceId }),
      invoice_id: invoiceId,
      application_fee: application_fee,
    });

    // Get user details for email notification
    const [mentee, mentor] = await Promise.all([
      User.findById(menteeId).select('email name'),
      User.findById(mentorId).select('email name'),
    ]);

    if (mentee?.email) {
      // Send payment confirmation email to mentee
      await sendPaymentConfirmationEmail(
        mentee.email,
        mentee.name || 'Mentee',
        mentor?.name || 'Mentor',
        amount,
        planType,
        invoiceId
      );
    }
  } catch (error) {
    console.error('Error creating payment record:', error);
  }
};

/**
 * Sends payment confirmation email to user
 */
const sendPaymentConfirmationEmail = async (
  email: string,
  userName: string,
  mentorName: string,
  amount: number,
  planType: PLAN_TYPE,
  invoiceId: string
) => {
  const emailData = emailTemplate.paymentConfirmation(
    email,
    userName,
    'success',
    amount,
    planType,
    invoiceId
  );

  try {
    await emailHelper.sendEmail(emailData);
  } catch (error) {
    console.error('Error sending payment confirmation email:', error);
  }
};

/**
 * Handles Stripe webhook events
 * @param req - Express request object
 * @param res - Express response object
 */
const handleWebhook = async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;

  try {
    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );

    console.log(`Processing webhook event: ${event.type}`);

    // Handle different webhook events
    switch (event.type) {
      case 'checkout.session.completed': {
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;
      }
      case 'invoice.created': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`Invoice created: ${invoice.id}`);
        // Optionally send invoice to customer
        // await stripe.invoices.sendInvoice(invoice.id);
        break;
      }
      case 'payment_intent.canceled': {
        await handlePaymentIntentCanceled(
          event.data.object as Stripe.PaymentIntent
        );
        break;
      }
      case 'invoice.payment_succeeded': {
        await handleInvoicePaymentSucceeded(
          event.data.object as Stripe.Invoice
        );
        break;
      }
      case 'invoice.payment_failed': {
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      }
      case 'payment_intent.payment_failed': {
        await handlePaymentIntentFailed(
          event.data.object as Stripe.PaymentIntent
        );
        break;
      }
      case 'customer.subscription.deleted': {
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;
      }
      case 'customer.subscription.updated': {
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        );
        break;
      }
    }

    res.json({ received: true });
  } catch (err: unknown) {
    console.error('Webhook Error:', err);
    res
      .status(400)
      .send(
        `Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
  }
};

/**
 * Handles checkout.session.completed event
 * @param session - Stripe Checkout Session
 */
const handleCheckoutSessionCompleted = async (
  session: Stripe.Checkout.Session
) => {
  const metadata = session.metadata || {};
  const { plan_type } = metadata;

  if (plan_type === PLAN_TYPE.Subscription) {
    // Handle subscription checkout completion
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    // Calculate subscription period dates
    const starting_date = new Date(subscription.current_period_start * 1000);
    const ending_date = new Date(subscription.current_period_end * 1000);

    // Update purchase record
    const updatedPurchase = await Purchase.findOneAndUpdate(
      {
        checkout_session_id: session.id,
      },
      {
        $set: {
          stripe_subscription_id: session.subscription as string,
          status: PAYMENT_STATUS.PAID,
          starting_date,
          ending_date,
          is_active: true,
          plan_status: PURCHASE_PLAN_STATUS.ACTIVE,
        },
      },
      {
        new: true,
      }
    );

    // Create payment record if purchase was updated
    if (updatedPurchase) {
      await createPaymentRecord(
        updatedPurchase.mentee_id,
        updatedPurchase.mentor_id,
        updatedPurchase.amount,
        PLAN_TYPE.Subscription,
        updatedPurchase.subscription_id || updatedPurchase._id,
        session.invoice as string,
        Number(updatedPurchase.application_fee || 0)
      );
    }
  } else if (plan_type === PLAN_TYPE.PayPerSession && metadata.session_id) {
    // Handle pay-per-session checkout completion

    const [updatedSession, updatedPurchase] = await Promise.all([
      Session.findByIdAndUpdate(
        metadata.session_id,
        {
          $set: {
            payment_required: false,
          },
        },
        { new: true }
      ),
      Purchase.findOneAndUpdate(
        {
          checkout_session_id: session.id,
        },
        {
          $set: {
            status: PAYMENT_STATUS.PAID,
            is_active: true,
            plan_status: PURCHASE_PLAN_STATUS.ACTIVE,
          },
        }
      ),
    ]);

    // Create payment record
    if (updatedPurchase) {
      await createPaymentRecord(
        new Types.ObjectId(metadata.mentee_id),
        new Types.ObjectId(metadata.mentor_id),
        Number(metadata.amount),
        PLAN_TYPE.PayPerSession,
        new Types.ObjectId(metadata.session_id),
        session.invoice as string,
        Number(updatedPurchase.application_fee || 0)
      );
    }
  } else {
    // Handle package checkout completion
    const updatedPurchase = await Purchase.findOneAndUpdate(
      {
        checkout_session_id: session.id,
      },
      {
        $set: {
          status: PAYMENT_STATUS.PAID,
          is_active: true,
          plan_status: PURCHASE_PLAN_STATUS.ACTIVE,
        },
      },
      {
        new: true,
      }
    );

    // Create payment record if purchase was updated
    if (updatedPurchase) {
      await createPaymentRecord(
        updatedPurchase.mentee_id,
        updatedPurchase.mentor_id,
        updatedPurchase.amount,
        PLAN_TYPE.Package,
        updatedPurchase.package_id || updatedPurchase._id,
        session.invoice as string,
        Number(updatedPurchase.application_fee || 0)
      );
    }
  }

  console.log('Checkout session completed with metadata:', metadata);
};

/**
 * Handles payment_intent.canceled event
 * @param paymentIntent - Stripe Payment Intent
 */
const handlePaymentIntentCanceled = async (
  paymentIntent: Stripe.PaymentIntent
) => {
  console.log(`Payment intent canceled: ${paymentIntent.id}`);

  // Update purchase status to canceled
  await Purchase.findOneAndUpdate(
    {
      checkout_session_id: paymentIntent.id,
    },
    {
      $set: {
        status: PAYMENT_STATUS.CANCELLED,
        is_active: false,
      },
    },
    {
      new: true,
    }
  );
};

/**
 * Handles invoice.payment_succeeded event
 * @param invoice - Stripe Invoice
 */
const handleInvoicePaymentSucceeded = async (invoice: Stripe.Invoice) => {
  console.log(`Invoice payment succeeded: ${invoice.id}`);
  const subscriptionId = invoice.subscription as string;

  // Check if payment record already exists to avoid duplicates
  const paymentRecord = await PaymentRecord.findOne({
    invoice_id: invoice.id,
  });

  if (subscriptionId && !paymentRecord) {
    // Update purchase record for subscription renewal
    const updatedPurchase = await Purchase.findOneAndUpdate(
      {
        stripe_subscription_id: subscriptionId,
      },
      {
        $set: {
          status: PAYMENT_STATUS.PAID,
          is_active: true,
          starting_date: new Date(invoice.period_start * 1000),
          ending_date: new Date(invoice.period_end * 1000),
          plan_status: PURCHASE_PLAN_STATUS.ACTIVE,
        },
      },
      {
        new: true,
      }
    );

    // Create payment record for the renewal
    if (updatedPurchase) {
      await createPaymentRecord(
        updatedPurchase.mentee_id,
        updatedPurchase.mentor_id,
        updatedPurchase.amount,
        PLAN_TYPE.Subscription,
        updatedPurchase._id,
        invoice.id,
        Number(updatedPurchase.application_fee || 0)
      );
    }
  }
};

/**
 * Handles invoice.payment_failed event
 * @param invoice - Stripe Invoice
 */
const handleInvoicePaymentFailed = async (invoice: Stripe.Invoice) => {
  console.log(`Invoice payment failed: ${invoice.id}`);
  const subscriptionId = invoice.subscription as string;

  if (subscriptionId) {
    // Update purchase status to failed
    await Purchase.findOneAndUpdate(
      {
        stripe_subscription_id: subscriptionId,
      },
      {
        $set: {
          is_active: false,
          plan_status: PURCHASE_PLAN_STATUS.EXPIRED,
          status: PAYMENT_STATUS.FAILED,
        },
      },
      {
        new: true,
      }
    );

    // Notify user about payment failure
    const purchase = await Purchase.findOne({
      stripe_subscription_id: subscriptionId,
    });

    if (purchase) {
      const user = await User.findById(purchase.mentee_id).select('email name');

      try {
        const paymentFailedTemplate = emailTemplate.payment(
          user?.email || '',
          user?.name || '',
          'failed'
        );
        await emailHelper.sendEmail(paymentFailedTemplate);
      } catch (error) {
        console.error('Error sending payment failure email:', error);
      }
    }
  }
};

/**
 * Handles payment_intent.payment_failed event
 * @param paymentIntent - Stripe Payment Intent
 */
const handlePaymentIntentFailed = async (
  paymentIntent: Stripe.PaymentIntent
) => {
  console.log(`Payment intent failed: ${paymentIntent.id}`);

  // Update purchase status to failed
  await Purchase.findOneAndUpdate(
    {
      checkout_session_id: paymentIntent.id,
    },
    {
      $set: {
        status: PAYMENT_STATUS.FAILED,
        is_active: false,
      },
    },
    {
      new: true,
    }
  );
};

/**
 * Handles customer.subscription.deleted event
 * This occurs when a subscription is fully canceled (after the billing period ends)
 * @param subscription - Stripe Subscription
 */
const handleSubscriptionDeleted = async (subscription: Stripe.Subscription) => {
  console.log(`Subscription deleted: ${subscription.id}`);

  // Update purchase record to reflect cancellation
  const purchase = await Purchase.findOneAndUpdate(
    {
      stripe_subscription_id: subscription.id,
    },
    {
      $set: {
        plan_status: PURCHASE_PLAN_STATUS.CANCELLED,
        subscription_cancelled: true,
        is_active: false,
      },
    },
    {
      new: true,
    }
  );

  // Notify user about subscription end
  if (purchase) {
    const user = await User.findById(purchase.mentee_id).select('email name');
    if (user?.email) {
      const emailData = emailTemplate.subscription(
        user.email,
        user.name || '',
        'ended'
      );

      try {
        await emailHelper.sendEmail(emailData);
      } catch (error) {
        console.error('Error sending subscription ended email:', error);
      }
    }
  }
};

/**
 * Handles customer.subscription.updated event
 * This occurs when a subscription is updated (including when it's marked for cancellation)
 * @param subscription - Stripe Subscription
 */
const handleSubscriptionUpdated = async (subscription: Stripe.Subscription) => {
  console.log(`Subscription updated: ${subscription.id}`);

  // Check if subscription is marked to be canceled at period end
  if (subscription.cancel_at_period_end) {
    // Subscription is marked for cancellation but still active until period end
    await Purchase.findOneAndUpdate(
      {
        stripe_subscription_id: subscription.id,
      },
      {
        $set: {
          subscription_cancelled: true,
          // Keep plan_status as ACTIVE until the period actually ends
          plan_status: PURCHASE_PLAN_STATUS.ACTIVE,
          ending_date: new Date(subscription.current_period_end * 1000),
        },
      },
      {
        new: true,
      }
    );

    // Notify user about upcoming cancellation
    const purchase = await Purchase.findOne({
      stripe_subscription_id: subscription.id,
    });

    if (purchase) {
      const user = await User.findById(purchase.mentee_id).select('email name');
      if (user?.email) {
        const endDate = new Date(subscription.current_period_end * 1000);
        const formattedDate = endDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        const cancelTemplate = emailTemplate.subscription(
          user.email,
          user.name || '',
          'ended',
          formattedDate
        );

        try {
          await emailHelper.sendEmail(cancelTemplate);
        } catch (error) {
          console.error(
            'Error sending cancellation confirmation email:',
            error
          );
        }
      }
    }
  } else {
    // Regular subscription update (not cancellation)
    await Purchase.findOneAndUpdate(
      {
        stripe_subscription_id: subscription.id,
      },
      {
        $set: {
          plan_status: PURCHASE_PLAN_STATUS.ACTIVE,
          is_active: true,
          subscription_cancelled: false,
          starting_date: new Date(subscription.current_period_start * 1000),
          ending_date: new Date(subscription.current_period_end * 1000),
        },
      },
      {
        new: true,
      }
    );
  }
};

export { handleWebhook };
