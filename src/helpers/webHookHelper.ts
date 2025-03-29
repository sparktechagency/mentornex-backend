import { StripeService } from '../app/modules/purchase/stripe.service';
import { Request, Response } from 'express';
import Stripe from 'stripe';
import stripe from '../config/stripe';
import { Purchase } from '../app/modules/purchase/purchase.model';
import { IPlanType } from '../types/plan';
import { PAYMENT_STATUS, PLAN_TYPE, PURCHASE_PLAN_STATUS } from '../app/modules/purchase/purchase.interface';
import { Session } from '../app/modules/sessionBooking/session.model';
import { SESSION_STATUS } from '../app/modules/sessionBooking/session.interface';
import { Types } from 'mongoose';
import { PaymentRecord } from '../app/modules/payment-record/payment-record.model';


const handleWebhook = async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );

    console.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(session,"👍👍👍👍👍👍")
        const metadata = session.metadata || {};
        const { plan_type } = metadata;

        if(plan_type === PLAN_TYPE.Subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const starting_date = new Date(subscription.current_period_start * 1000);
          const ending_date = new Date(subscription.current_period_end * 1000);

            const updatedPurchase = await Purchase.findOneAndUpdate({
              checkout_session_id: session.id
            }, {
              $set: {
                stripe_subscription_id: session.subscription as string,
                status: 'PAID',
                starting_date: starting_date,
                ending_date: ending_date,
                is_active: true
              }
            }, {
              new: true
            })

            if(updatedPurchase){
              await createPaymentRecord(updatedPurchase.mentee_id, updatedPurchase.mentor_id, updatedPurchase.amount, PLAN_TYPE.Subscription, updatedPurchase.subscription_id!, session.invoice as string);
            }
        }else if(plan_type === PLAN_TYPE.PayPerSession && metadata.session_id) {
          console.log(session,"👍👍👍👍👍👍",session.invoice)
   
          const updatedSession = await Session.findByIdAndUpdate(metadata.session_id, {
            $set: {
             payment_required: false,
            }
          }, {new: true});
          
          console.log('Updated session:', updatedSession);


         
            await createPaymentRecord(new Types.ObjectId(metadata.mentee_id), new Types.ObjectId(metadata.mentor_id), Number(metadata.amount), PLAN_TYPE.PayPerSession, new Types.ObjectId(metadata.session_id), session.invoice as string);
          
        }
          else{
        console.log(session,"👍👍👍👍👍👍")

          const [updatedPurchase] = await Promise.all([

            //handle pay per session and package
            Purchase.findOneAndUpdate({
              checkout_session_id: session.id
            }, {
              $set: {
                status: PAYMENT_STATUS.PAID,
                is_active: true
              }
            }, {  
              new: true
          })
        ]);

        if(updatedPurchase){
          await createPaymentRecord(updatedPurchase.mentee_id, updatedPurchase.mentor_id, updatedPurchase.amount, PLAN_TYPE.Package, updatedPurchase._id, session.invoice as string);
        }
        }

        
        console.log('Checkout session completed with metadata:', metadata);
        
      
        break;
      }
      case 'invoice.created': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`Invoice created: ${invoice.id},👍👍, ${invoice}`);
        // await stripe.invoices.sendInvoice(invoice.id);
        break;
      }
      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`Payment intent canceled: ${paymentIntent.id}`);
        await Purchase.findOneAndUpdate({
          checkout_session_id: paymentIntent.id
        }, {
          $set: {
            status: PAYMENT_STATUS.CANCELLED
          }
        }, {
          new: true
        })
      
        break;
      }
      case 'invoice.payment_succeeded': {
        
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`Invoice payment succeeded: ${invoice.id}`);
        const subscriptionId = invoice.subscription as string;

        console.log(invoice,"👍👍👍👍👍👍")
        //check if payment is already created
        const paymentRecord = await PaymentRecord.findOne({
          invoice_id: invoice.id
        })

        if(subscriptionId && !paymentRecord){
          const updatedPurchase = await Purchase.findOneAndUpdate({
            stripe_subscription_id: subscriptionId
          }, {
            $set: {
              status: PAYMENT_STATUS.PAID,

              is_active: true,
              starting_date: new Date(invoice.period_start * 1000),
              ending_date: new Date(invoice.period_end * 1000),
              plan_status: PURCHASE_PLAN_STATUS.ACTIVE
            }
          }, {
            new: true
          })

          if(updatedPurchase){
            await createPaymentRecord(updatedPurchase.mentee_id, updatedPurchase.mentor_id, updatedPurchase.amount, PLAN_TYPE.Subscription, updatedPurchase._id, invoice.id);
          }
        }
        
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`Invoice payment failed: ${invoice.id}`);
        const subscriptionId = invoice.subscription as string;

        if(subscriptionId){
          const updatedPurchase = await Purchase.findOneAndUpdate({
            stripe_subscription_id: subscriptionId
          }, {
            $set: {
              is_active: false,
              plan_status: PURCHASE_PLAN_STATUS.EXPIRED,
              status: PAYMENT_STATUS.FAILED
            }
          }, {
            new: true
          })
        }
        
        break;
      }
      
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`Payment intent failed: ${paymentIntent.id}`);
        await Purchase.findOneAndUpdate({
          checkout_session_id: paymentIntent.id
        }, {
          $set: {
            status: PAYMENT_STATUS.FAILED
          }
        }, {
          new: true
        })
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`Subscription deleted: ${subscription.id}`);
        await Purchase.findOneAndUpdate({
          stripe_subscription_id: subscription.id
        }, {
          $set: {
            plan_status: PURCHASE_PLAN_STATUS.CANCELLED,
            subscription_cancelled: true
          }
        }, {
          new: true
        })
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`Subscription updated: ${subscription.id}`);
        await Purchase.findOneAndUpdate({
          stripe_subscription_id: subscription.id
        }, {
          $set: {
            plan_status: PURCHASE_PLAN_STATUS.ACTIVE
          }
        }, {
          new: true
        })
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



const createPaymentRecord = async (menteeId: Types.ObjectId, mentorId: Types.ObjectId, amount: number, planType: PLAN_TYPE, planId: Types.ObjectId, invoiceId?: string) => {
  console.log('Creating payment record for mentee:', menteeId, 'mentor:', mentorId, 'amount:', amount, 'planType:', planType, 'planId:', planId, 'invoiceId:', invoiceId);
  const paymentRecord = await PaymentRecord.create({
    mentee_id: menteeId,
    mentor_id: mentorId,
    ...(planType === PLAN_TYPE.Subscription && { subscription_id: planId }),
    ...(planType === PLAN_TYPE.Package && { package_id: planId }),
    ...(planType === PLAN_TYPE.PayPerSession && { pay_per_session_id: planId }),
    amount: amount,
    type: planType,
    application_fee: amount * 0.1,
    ...(invoiceId && { invoice_id: invoiceId }),
  });
  return paymentRecord;
}

export const WebhookHelper = {
  handleWebhook,
};