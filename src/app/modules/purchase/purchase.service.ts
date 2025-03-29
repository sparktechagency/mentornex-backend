import { JwtPayload } from 'jsonwebtoken';
import { PURCHASE_PLAN_STATUS, PLAN_TYPE, PAYMENT_STATUS } from './purchase.interface';
import { Types } from 'mongoose';
import { Package, PayPerSession, Subscription } from '../plans/plans.model';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { StripeService } from './stripe.service';
import { Purchase } from './purchase.model';
import { IUser } from '../user/user.interface';
import { IPackage, IPayPerSession, ISubscription } from '../plans/plans.interface';
import { User } from '../user/user.model';
import { Session } from '../sessionBooking/session.model';
import { SESSION_STATUS } from '../sessionBooking/session.interface';
import { getRemainingQuotaForPackageOrSubscription } from '../sessionBooking/session.utils';


const purchasePayPerSession = async(user:JwtPayload, id:Types.ObjectId) =>{


        const [session, isUserExist] = await Promise.all([
            Session.findById(id).populate<{pay_per_session_id:IPayPerSession, mentor_id:Partial<IUser>}>({path:'pay_per_session_id', select:{stripe_price_id:1, amount:1, duration:1, title:1, _id:1}}).populate<{mentor_id:Partial<IUser>}>({path:'mentor_id', select:{stripeCustomerId:1, stripe_account_id:1, _id:1, timeZone:1}}).lean(),
            User.findById(user.id).select("timeZone status").lean()
          ]);
        
        if(!session){
            throw new ApiError(StatusCodes.NOT_FOUND, 'Requested session does not exist.')
        }

        if(!session.mentor_id.stripe_account_id) throw new ApiError(StatusCodes.BAD_REQUEST, 'Mentor is not eligible to sell this session.');
    
        if(!isUserExist || isUserExist.status !== 'active') throw new ApiError(StatusCodes.BAD_REQUEST, 'You are not authorized to purchase this session.');
        if(session.status !== SESSION_STATUS.ACCEPTED) throw new ApiError(StatusCodes.BAD_REQUEST, 'Session can be only booked after mentor accepts the session request.');
    
        const {stripeCustomerId, stripe_account_id, _id} = session.mentor_id;
        
    
        const payment = await StripeService.createCheckoutSession(stripeCustomerId!, user.id,_id!.toString(), session.topic, PLAN_TYPE.PayPerSession, stripe_account_id as string, session.pay_per_session_id.amount, undefined, session._id.toString());
    
        if(!payment){
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create checkout session.')
        }
    
    
        return payment.url;
    

}

const purchasePackage = async(user:JwtPayload, id:Types.ObjectId) =>{


    //check whether the requested user already have a package.
    const isAlreadyPurchased = await Purchase.findOne({mentee_id: user.id, plan_type: PLAN_TYPE.Package, plan_status: PURCHASE_PLAN_STATUS.ACTIVE}).lean();
    if(isAlreadyPurchased) throw new ApiError(StatusCodes.BAD_REQUEST, 'You already have a package with this mentor. After the package quota is over, you can purchase another package.');

    const pkg = await Package.findById(id).populate<{mentor_id:Partial<IUser>}>({path:'mentor_id', select:{stripeCustomerId:1, stripe_account_id:1, _id:1}}).lean();
    if(!pkg){
        throw new ApiError(StatusCodes.NOT_FOUND, 'Requested package does not exist.')
    }
    if(pkg.status !== 'active') throw new ApiError(StatusCodes.BAD_REQUEST, 'Package is not active.');

    const {stripeCustomerId, stripe_account_id, _id} = pkg.mentor_id;

    const purchasePayload = {
        mentor_id: pkg.mentor_id,
        mentee_id: user.id,
        package_id: pkg._id,
        plan_type: PLAN_TYPE.Package,
        amount: pkg.amount,
        checkout_session_id: '',
        application_fee: pkg.amount * 0.1
    }
    

    const payment = await StripeService.createCheckoutSession(stripeCustomerId!, user.id,_id!.toString(), pkg.title, PLAN_TYPE.Package, stripe_account_id as string, pkg.amount, undefined, pkg._id.toString());

    if(!payment){
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create checkout session.')
    }

    purchasePayload.checkout_session_id = payment.sessionId;

    const result = await Purchase.create(purchasePayload);
    if(!result) throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create purchase.');
    return payment.url;
}

const purchaseSubscription = async(user:JwtPayload, id:Types.ObjectId) =>{

    const isAlreadyPurchased = await Purchase.findOne({mentee_id: user.id, plan_type: PLAN_TYPE.Subscription, plan_status: PURCHASE_PLAN_STATUS.ACTIVE}).lean();

    if(isAlreadyPurchased) throw new ApiError(StatusCodes.BAD_REQUEST, 'You already have a subscription with this mentor. In order to purchase another subscription, you need to cancel the existing subscription first.');

    const subscription = await Subscription.findById(id).populate<{mentor_id:Partial<IUser>}>({path:'mentor_id', select:{stripeCustomerId:1, stripe_account_id:1, _id:1}}).lean();
    if(!subscription){
        throw new ApiError(StatusCodes.NOT_FOUND, 'Requested subscription does not exist.')
    }

    const {stripeCustomerId, stripe_account_id, _id} = subscription.mentor_id;

    const purchasePayload = {
        mentor_id: subscription.mentor_id,
        mentee_id: user.id,
        subscription_id: subscription._id,
        plan_type: PLAN_TYPE.Subscription,
        amount: subscription.amount,
        checkout_session_id: '',
        remaining_sessions: subscription.sessions,
        application_fee: subscription.amount * 0.1
    }
    

    const payment = await StripeService.createCheckoutSession(stripeCustomerId!, user.id,_id!.toString(), subscription.title, PLAN_TYPE.Subscription, stripe_account_id as string, subscription.amount, subscription.stripe_price_id, subscription._id.toString());

    if(!payment){
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create checkout session.')
    }

    purchasePayload.checkout_session_id = payment.sessionId;
    const result = await Purchase.create(purchasePayload);
    if(!result) throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create purchase.');
    return payment.url;
}


const cancelSubscription = async(user:JwtPayload, id:Types.ObjectId) =>{
    const subscription = await Purchase.findById(id);


    if(!subscription){
        throw new ApiError(StatusCodes.NOT_FOUND, 'Requested subscription does not exist.')
    }

    if(subscription.mentee_id.toString() !== user.id) throw new ApiError(StatusCodes.BAD_REQUEST, 'You are not authorized to cancel this subscription');

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
