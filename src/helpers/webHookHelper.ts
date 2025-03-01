import { Request, Response } from 'express';
import Stripe from 'stripe';
import stripe from '../config/stripe';
import { Session } from '../app/modules/sessionBooking/session.model';
import { Subscription } from '../app/modules/subscription/subscription.model';
import { SubscriptionService } from '../app/modules/subscription/subscription.service';
import { PaymentRecord } from '../app/modules/payment-record/payment-record.model';
import { User } from '../app/modules/user/user.model';
import { PricingPlan } from '../app/modules/mentorPricingPlan/pricing-plan.model';

const handleWebhook = async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;

  try {
    const event = await stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );

    console.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata || {};
        
        console.log('Checkout session completed with metadata:', metadata);
        
        // Handle subscription checkout
        if (metadata.planType && metadata.mentorId) {
          await handleSubscriptionCheckout(session);
        }
        else {
          console.log('Unrecognized checkout session type, missing required metadata');
        }
        break;
      }

      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`Payment intent canceled: ${paymentIntent.id}`);

        // Handle cancellation for both subscriptions and sessions
        const sessionRecord = await Session.findOne({
          stripe_payment_intent_id: paymentIntent.id,
        });

        if (sessionRecord) {
          sessionRecord.status = 'cancelled';
          sessionRecord.payment_status = 'cancelled';
          await sessionRecord.save();
          console.log(`Session ${sessionRecord._id} marked as cancelled`);
        }
        
        // Also check subscriptions
        const subscription = await Subscription.findOne({
          stripe_payment_intent_id: paymentIntent.id,
        });
        
        if (subscription) {
          await SubscriptionService.updateSubscriptionStatus(
            subscription.stripe_subscription_id,
            'cancelled'
          );
          console.log(`Subscription ${subscription._id} marked as cancelled`);
        }
        break;
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (subscriptionId) {
          console.log(`Invoice payment succeeded for subscription: ${subscriptionId}`);
          const existingSubscription = await Subscription.findOne({
            stripe_subscription_id: subscriptionId,
          });

          if (existingSubscription) {
            const subscription = await SubscriptionService.updateSubscriptionStatus(
              subscriptionId,
              'active'
            );

            if (subscription && invoice.payment_intent) {
              await PaymentRecord.create({
                subscribed_plan_id: subscription.stripe_subscription_id,
                payment_intent_id: invoice.payment_intent as string,
                mentee_id: existingSubscription.mentee_id,
                mentor_id: existingSubscription.mentor_id,
                amount: invoice.amount_paid / 100,
                status: 'succeeded',
              });
              console.log(`Payment record created for subscription renewal`);
            }
          } else {
            console.log(`No subscription found with ID: ${subscriptionId}`);
          }
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Find the session associated with this payment intent
        const sessionRecord = await Session.findOne({
          stripe_payment_intent_id: paymentIntent.id
        }).populate('mentor_id', 'name email').populate('mentee_id', 'name email');

        if (sessionRecord) {
          try {
            /*const mentorEmail = sessionRecord.mentor_id.email;
            const mentorName = sessionRecord.mentor_id.name;
            const menteeEmail = sessionRecord.mentee_id.email;
            const menteeName = sessionRecord.mentee_id.name;
            
            const meetingTitle = `Mentoring Session with ${mentorName}`;
            
            const videoMeeting = await setupZoomVideoMeeting(
              mentorEmail,
              menteeEmail,
              meetingTitle
            );*/
            
            //sessionRecord.meeting_id = videoMeeting.sessionId;
            sessionRecord.payment_status = 'held';
            sessionRecord.status = 'accepted';
            //sessionRecord.meeting_url = videoMeeting.meeting_url;

            await sessionRecord.save();
          } catch (error) {
            console.error('Error creating Zoom meeting:', error);
            // Still mark payment as successful but log the Zoom creation error
            sessionRecord.payment_status = 'held';
            sessionRecord.status = 'accepted';
            await sessionRecord.save();
          }
        }
        break;
      }
      
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`Payment intent failed: ${paymentIntent.id}`);
        
        // Find the session associated with this payment intent
        const sessionRecord = await Session.findOne({
          stripe_payment_intent_id: paymentIntent.id
        });
        
        if (sessionRecord) {
          // Update session status
          sessionRecord.payment_status = 'failed';
          await sessionRecord.save();
          console.log(`Session ${sessionRecord._id} payment marked as failed`);
        }
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

// Helper function to handle subscription checkouts - unchanged
const handleSubscriptionCheckout = async (checkoutSession: Stripe.Checkout.Session) => {
  try {
    const metadata = checkoutSession.metadata || {};
    const { mentorId, planType, accountId } = metadata;
    
    console.log(`Processing subscription checkout for mentor: ${mentorId}, plan type: ${planType}`);
    
    if (!mentorId || !planType || !accountId) {
      console.error('Missing required metadata:', metadata);
      return;
    }

    // Get customer email from the checkout session
    // First, try to get it from the prefilled_email parameter which should be passed
    // from frontend as a query parameter to the payment link
    const customerEmail = checkoutSession.customer_email || 
                         metadata.prefilled_email || 
                         (checkoutSession.customer_details ? checkoutSession.customer_details.email : null);
    
    if (!customerEmail) {
      console.error('No customer email found in checkout session');
      return;
    }
    
    console.log(`Looking up mentee with email: ${customerEmail}`);
    
    // Find mentee using the email
    const mentee = await User.findOne({ email: customerEmail });
    
    if (!mentee) {
      console.error(`No mentee found with email: ${customerEmail}`);
      return;
    }
    
    const menteeIdStr = mentee._id.toString();
    console.log(`Found mentee with ID: ${menteeIdStr} and stripeCustomerId: ${mentee.stripeCustomerId}`);
    
    // Get line item details from the connected account
    const lineItems = await stripe.checkout.sessions.listLineItems(
      checkoutSession.id,
      { limit: 1 },
      { stripeAccount: accountId }
    );
    
    const lineItem = lineItems.data[0];
    if (!lineItem) {
      console.error('No line items found in session');
      return;
    }
    
    // Get price and subscription details
    const priceId = lineItem.price?.id;
    if (!priceId) {
      console.error('No price ID found in line item');
      return;
    }
    
    console.log(`Line item with price ID: ${priceId}`);
    
    // If this is a subscription checkout, get the subscription ID
    let subscriptionId = null;
    if (planType === 'Subscription' && checkoutSession.subscription) {
      subscriptionId = checkoutSession.subscription as string;
      console.log(`Subscription ID: ${subscriptionId}`);
    }
    
    // Get pricing plan from database to extract necessary details
    const pricingPlan = await PricingPlan.findOne({
      mentor_id: mentorId,
      $or: [
        { 'subscriptions.stripe_price_id': priceId },
        { 'pay_per_sessions.stripe_price_id': priceId }
      ]
    });
    
    if (!pricingPlan) {
      console.error('Pricing plan not found for price:', priceId);
      return;
    }
    
    // Determine if this is a subscription or pay-per-session
    let planDetails;
    if (planType === 'Subscription') {
      planDetails = pricingPlan.subscriptions?.stripe_price_id === priceId 
        ? pricingPlan.subscriptions 
        : null;
    } else {
      planDetails = pricingPlan.pay_per_sessions?.find(
        session => session.stripe_price_id === priceId
      );
    }
    
    if (!planDetails) {
      console.error('Plan details not found for price:', priceId);
      return;
    }
    
    console.log(`Found plan details:`, planDetails);
    
    // Check if there's already a subscription with the same stripe_subscription_id
    const existingSubscription = await Subscription.findOne({
      stripe_subscription_id: subscriptionId || `one-time-${checkoutSession.id}`,
    });
    
    if (existingSubscription) {
      console.log('Subscription already exists in database, skipping creation');
      return;
    }
    
    // Create subscription in our database
    const amount = lineItem.amount_total / 100;
    const dbSubscription = await SubscriptionService.createSubscription({
      menteeId: menteeIdStr,
      mentorId,
      priceId,
      planType: planType as any,
      stripePriceId: priceId,
      stripeSubscriptionId: subscriptionId || `one-time-${checkoutSession.id}`,
      amount,
      planDetails,
      stripeConnectedAccountId: accountId,
      stripeConnectedCustomerId: mentee.stripeCustomerId || checkoutSession.customer as string
    });

    console.log(`Created subscription in database with ID: ${dbSubscription._id}`);

    // Create payment record
    if (dbSubscription && checkoutSession.payment_intent) {
      const paymentRecord = await PaymentRecord.create({
        subscribed_plan_id: dbSubscription.stripe_subscription_id,
        payment_intent_id: checkoutSession.payment_intent as string,
        mentee_id: menteeIdStr,
        mentor_id: mentorId,
        amount: amount,
        status: 'succeeded',
        stripe_connected_account_id: accountId
      });
      
      console.log(`Created payment record with ID: ${paymentRecord._id}`);
    }
  } catch (error) {
    console.error('Error in handleSubscriptionCheckout:', error);
  }
};

export const WebhookHelper = {
  handleWebhook,
};