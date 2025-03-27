import { StripeService } from '../app/modules/purchase/stripe.service';
import { Request, Response } from 'express';
import Stripe from 'stripe';
import stripe from '../config/stripe';
import { Purchase } from '../app/modules/purchase/purchase.model';
import { IPlanType } from '../types/plan';
import { PAYMENT_STATUS, PLAN_TYPE, PURCHASE_PLAN_STATUS } from '../app/modules/purchase/purchase.interface';


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
        const metadata = session.metadata || {};

        const { planType, stripe_account_id: accountId } = metadata;

        if(planType === PLAN_TYPE.Subscription) {
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
        
        }else{
          const [invoice, updatedPurchase] = await Promise.all([
            StripeService.createInvoice({
              customerId: session.customer as string,
              amount: Number(metadata.amount) * 100,
              metadata: {
                purchaseId: metadata.purchaseId,
                checkout_session_id: session.id,
                planType: planType as IPlanType
              },
              accountId: accountId
            }),
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


        if(subscriptionId){
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



export const WebhookHelper = {
  handleWebhook,
};