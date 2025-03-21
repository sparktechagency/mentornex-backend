import { JwtPayload } from 'jsonwebtoken';
import { PurchaseModel } from './purchase.interface';
import { Types } from 'mongoose';
import { Package, PayPerSession, Subscription } from '../plans/plans.model';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { StripeService } from './stripe.service';
import { User } from '../user/user.model';
import { Purchase } from './purchase.model';
import { convertDate } from '../../../util/dateHelper';
import { IUser } from '../user/user.interface';


const purchasePayPerSession = async(user:JwtPayload, id:Types.ObjectId, payload:{date:string, slot:string, timeZone:string}) =>{
    const session = await PayPerSession.findById(id).populate<{mentor_id:Partial<IUser>}>({path:'mentor_id', select:{stripeCustomerId:1, stripe_account_id:1, _id:1}}).lean();
    if(!session){
        throw new ApiError(StatusCodes.NOT_FOUND, 'Requested session does not exist.')
    }

    const {stripeCustomerId, stripe_account_id, _id} = session.mentor_id;

    const date = convertDate(payload.date, payload.slot, payload.timeZone);

    const purchasePayload = {
        mentor_id: session.mentor_id,
        mentee_id: user.id,
        pay_per_session_id: session._id,
        plan_type: 'PayPerSession',
        amount: session.amount,
        checkout_session_id: '',
        date: date,
    }
    

    const payment = await StripeService.createCheckoutSession(stripeCustomerId!, user.id,_id!.toString(), session.title, 'PayPerSession', stripe_account_id as string, session.amount);

    if(!payment){
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create checkout session.')
    }

    purchasePayload.checkout_session_id = payment.sessionId;

    const result = await Purchase.create(purchasePayload);
    if(!result) throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create purchase.');
    return payment.url;

}

const purchasePackage = async(user:JwtPayload, id:Types.ObjectId) =>{
    const pkg = await Package.findById(id).populate<{mentor_id:Partial<IUser>}>({path:'mentor_id', select:{stripeCustomerId:1, stripe_account_id:1, _id:1}}).lean();
    if(!pkg){
        throw new ApiError(StatusCodes.NOT_FOUND, 'Requested package does not exist.')
    }

    const {stripeCustomerId, stripe_account_id, _id} = pkg.mentor_id;

    const purchasePayload = {
        mentor_id: pkg.mentor_id,
        mentee_id: user.id,
        package_id: pkg._id,
        plan_type: 'Package',
        amount: pkg.amount,
        checkout_session_id: '',

    }
    

    const payment = await StripeService.createCheckoutSession(stripeCustomerId!, user.id,_id!.toString(), pkg.title, 'Package', stripe_account_id as string, pkg.amount);

    if(!payment){
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create checkout session.')
    }

    purchasePayload.checkout_session_id = payment.sessionId;

    const result = await Purchase.create(purchasePayload);
    if(!result) throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create purchase.');
    return payment.url;
}

const purchaseSubscription = async(user:JwtPayload, id:Types.ObjectId) =>{
    const subscription = await Subscription.findById(id).populate<{mentor_id:Partial<IUser>}>({path:'mentor_id', select:{stripeCustomerId:1, stripe_account_id:1, _id:1}}).lean();
    if(!subscription){
        throw new ApiError(StatusCodes.NOT_FOUND, 'Requested subscription does not exist.')
    }

    const {stripeCustomerId, stripe_account_id, _id} = subscription.mentor_id;

    const purchasePayload = {
        mentor_id: subscription.mentor_id,
        mentee_id: user.id,
        subscription_id: subscription._id,
        plan_type: 'Subscription',
        amount: subscription.amount,
        checkout_session_id: '',
        remaining_sessions: subscription.sessions,
    }
    

    const payment = await StripeService.createCheckoutSession(stripeCustomerId!, user.id,_id!.toString(), subscription.title, 'Subscription', stripe_account_id as string, subscription.amount, subscription.stripe_price_id);

    if(!payment){
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create checkout session.')
    }

    purchasePayload.checkout_session_id = payment.sessionId;
    const result = await Purchase.create(purchasePayload);
    if(!result) throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create purchase.');
    return payment.url;
}


const cancelSubscription = async(user:JwtPayload,id:Types.ObjectId) =>{
    const subscription = await Purchase.findById(id);

    if(!subscription){
        throw new ApiError(StatusCodes.NOT_FOUND, 'Requested subscription does not exist.')
    }

    const canceledSubscription = await StripeService.cancelSubscription(subscription.stripe_subscription_id!);

    if(!canceledSubscription){
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to cancel subscription.')
    }
 
}

export const PurchaseServices = { 
    purchasePayPerSession,
    purchasePackage,
    purchaseSubscription,
    cancelSubscription
};
