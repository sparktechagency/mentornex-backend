import { JwtPayload } from 'jsonwebtoken';
import { ISession, ISessionFilter, SESSION_STATUS } from "./session.interface"
import { User } from "../user/user.model"
import ApiError from "../../../errors/ApiError"
import { StatusCodes } from "http-status-codes"
import { calculateEndTime, convertSessionTimeToLocal, convertSessionTimeToUTC } from "../../../helpers/date.helper"
import { Session } from "./session.model"
import mongoose, { Types } from "mongoose"
import { getActivePackageOrSubscription, getRemainingQuotaForPackageOrSubscription, handleNotificationAndDataSendForSocket, isSlotAvailable } from "./session.utils"
import { IPaginationOptions } from '../../../types/pagination';
import { sessionSearchableFields } from './session.constants';
import { paginationHelper } from '../../../helpers/paginationHelper';




const createSessionRequest = async (
    user: JwtPayload,
    payload: ISession & { slot: string, date: string },
    payPerSession?: boolean
) => {
   
    const session = await mongoose.startSession();
    session.startTransaction();
    const duration = 45;
    try {
        
        const isUserExist = await User.findById(user.id).lean();
        if (!isUserExist || isUserExist.status !== 'active') {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'You are not authorized to purchase this session.');
        }
        // Convert slot to UTC with proper date reference
        const convertedSlot = convertSessionTimeToUTC(payload.slot, isUserExist.timeZone, payload.date);
        const convertedDate = new Date(convertedSlot.isoString);
        const endTime = calculateEndTime(convertedDate, duration);


        //need to check if the slot is available //TODO
        const isRequestedSlotAvailable = await isSlotAvailable(payload.mentor_id as Types.ObjectId, convertedDate, endTime, duration);
        if (!isRequestedSlotAvailable) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'The requested slot is not available.');
        }

        const mentorId = payload.mentor_id as Types.ObjectId;
        if(!payload.package_id || !payload.subscription_id) {
            if(payload.package_id){
                const pkg = await getActivePackageOrSubscription(isUserExist._id, mentorId, payload.package_id, undefined);
 
                if(!pkg) throw new ApiError(StatusCodes.BAD_REQUEST, 'Package data not found, please try again.');
                //check if the quota is over
                const pkgQuota = await getRemainingQuotaForPackageOrSubscription(isUserExist._id, mentorId, pkg.package_id!._id, undefined);
                //@ts-ignore
                if(pkgQuota >= pkg?.package_id!.sessions!) throw new ApiError(StatusCodes.BAD_REQUEST, 'Package quota is over. Please purchase a new package.');
                payload.package_id = pkg.package_id!._id;
                payload.payment_required = false;
            }
            if( payload.subscription_id){
                const subscription = await getActivePackageOrSubscription(isUserExist._id, mentorId, undefined, payload.subscription_id);
                if(!subscription) throw new ApiError(StatusCodes.BAD_REQUEST, 'Subscription data not found, please try again.');
                //check if the quota is over
                const subscriptionQuota = await getRemainingQuotaForPackageOrSubscription(isUserExist._id, mentorId, undefined, subscription.subscription_id!._id);
                //@ts-ignore
                if(subscriptionQuota >= subscription?.subscription_id!.sessions!) throw new ApiError(StatusCodes.BAD_REQUEST, 'Subscription quota is over. Please purchase a new subscription.');
                payload.subscription_id = subscription.subscription_id!._id;
                payload.payment_required = false;
            }
        }




        const sessionData = {
            mentor_id: payload.mentor_id,
            mentee_id: user.id,
            scheduled_time: convertedDate,
            end_time: endTime,
            topic: payload.topic,
            duration: payload.duration,
            expected_outcome: payload.expected_outcome,
            session_plan_type: payload.session_plan_type,
            status: SESSION_STATUS.PENDING,
            payment_required: payload.payment_required,
            ...(payPerSession && { pay_per_session_id: payload.pay_per_session_id }),
            ...(payload.package_id && { package_id: payload.package_id }),
            ...(payload.subscription_id && { subscription_id: payload.subscription_id })
        };
    
    
    
    
        const bookedSession = await Session.create([sessionData], { session });
        
        if(!bookedSession[0]) throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create session request.');

        await session.commitTransaction();

        await handleNotificationAndDataSendForSocket(user.id.toString(), payload.mentor_id.toString(), SESSION_STATUS.PENDING, bookedSession[0]._id.toString());
    

        return bookedSession;
    } catch (error) {
        console.error('Error creating session request:', error);
        await session.abortTransaction();

        throw error;
    } finally {
        await session.endSession();
    }
};


const updateBookedSession = async (user: JwtPayload, sessionId: Types.ObjectId, payload: ISession & { slot: string, date: string }) => {
    const duration = 45;
    const isUserExist = await User.findById(user.id).lean();
    if (!isUserExist || isUserExist.status !== 'active') {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'You are not authorized to access this session.');
    }

    const session = await Session.findById(sessionId).populate<{mentee_id: {name: string, timeZone: string, _id: Types.ObjectId}}>('mentee_id', 'name timeZone _id').populate<{mentor_id: {name: string, timeZone: string, _id: Types.ObjectId}}>('mentor_id', 'name timeZone _id');
    console.log(user.id, session?.mentee_id._id.toString(), session?.mentor_id._id.toString())
    if (!session || session.mentee_id._id.toString() !== user.id && session.mentor_id._id.toString() !== user.id) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'You are not authorized to access this session.');
    }

   

    if(payload.status === SESSION_STATUS.ACCEPTED){
        if( user.id !== session.mentor_id._id.toString()){
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Only mentor can accept the session.');
        }

        if(session.status !== SESSION_STATUS.PENDING) throw new ApiError(StatusCodes.BAD_REQUEST, 'Session can be only booked after mentor accepts the session request.');
        session.status = payload.status;
        await session.save();

        await handleNotificationAndDataSendForSocket(user.id.toString(), session.mentee_id._id.toString(), SESSION_STATUS.ACCEPTED, session._id.toString(), session);
    }

    if(payload.status === SESSION_STATUS.CANCELLED){
        if( user.id !== session.mentor_id._id.toString() && session.status !== SESSION_STATUS.PENDING){
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Only mentor can cancel the session.');
        }
        session.status = payload.status;
        session.cancel_reason = payload.cancel_reason;
        await session.save();
        const receiver = user.id === session.mentor_id._id.toString() ? session.mentee_id._id.toString() : session.mentor_id._id.toString();
        await handleNotificationAndDataSendForSocket(user.id.toString(), receiver, SESSION_STATUS.CANCELLED, session._id.toString(), session);

    }

    if(payload.status === SESSION_STATUS.RESCHEDULED && !(session.status === SESSION_STATUS.CANCELLED || session.status === SESSION_STATUS.ACCEPTED)){
       throw new ApiError(StatusCodes.BAD_REQUEST, 'Only cancelled or accepted sessions can be rescheduled.');
    }

    if(payload.status === SESSION_STATUS.RESCHEDULED && (session.status === SESSION_STATUS.CANCELLED  || session.status === SESSION_STATUS.ACCEPTED)){
        if(user.id !== session.mentee_id.toString() && user.id !== session.mentor_id.toString()){
            throw new ApiError(StatusCodes.BAD_REQUEST, 'You are not authorized to reschedule this session.');
        }
        if(payload.date && payload.slot){
            session.status = payload.status;
            const convertedSlot = convertSessionTimeToUTC(payload.slot, isUserExist.timeZone, payload.date);
            const convertedDate = new Date(convertedSlot.isoString);

            const endTime = calculateEndTime(convertedDate, duration);
            session.scheduled_time = convertedDate;
            session.end_time = endTime;
            await session.save();
            const receiver = user.id === session.mentor_id._id.toString() ? session.mentee_id._id.toString() : session.mentor_id._id.toString();
            await handleNotificationAndDataSendForSocket(user.id.toString(), receiver, SESSION_STATUS.RESCHEDULED, session._id.toString(), session);
        }else{
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Date and slot are required to reschedule the session.');
        }
    }

    return session;
};

const getSession = async (user: JwtPayload, sessionId: Types.ObjectId) => {
    const isUserExist = await User.findById(user.id).lean();
    if (!isUserExist || isUserExist.status !== 'active') {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'You are not authorized to access this session.');
    }

    const session = await Session.findById(sessionId).lean();
    if (!session) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Session not found');
    }

    const displayTime = convertSessionTimeToLocal(session.scheduled_time, isUserExist.timeZone);
    const displayEndTime = convertSessionTimeToLocal(session.end_time, isUserExist.timeZone);

    return { 
        ...session, 
        scheduled_time: displayTime,
        end_time: displayEndTime
    };
};


const getSessionBookingsByUser =async (user:JwtPayload, paginationOptions: IPaginationOptions, filters:ISessionFilter)=>{
    const {searchTerm, ...filterableFields} = filters;
    const anyCondition: any[] = []

    const {page, limit, skip, sortBy, sortOrder} = paginationHelper.calculatePagination(paginationOptions);

    if(searchTerm){
        sessionSearchableFields.map(field=>{
            anyCondition.push({[field]: {$regex: searchTerm, $options: 'i'}})
        })
    }

    if(Object.entries(filterableFields).length > 0){
        anyCondition.push({
            $and: Object.entries(filterableFields).map(([field, value]) => {
              return {
                [field]: value,
              };
            }),
          });
    }

    anyCondition.push({$or: [{mentee_id: user.id}, {mentor_id: user.id}]});
    const whereCondition = anyCondition.length > 0 ? { $and: anyCondition } : {};

    const sessions = await Session.find(whereCondition).populate<{mentee_id: {name: string, timeZone: string, _id: Types.ObjectId}}>('mentee_id', 'name timeZone _id').populate<{mentor_id: {name: string, timeZone: string, _id: Types.ObjectId}}>('mentor_id', 'name timeZone _id').lean().skip(skip).limit(limit).sort({[sortBy]: sortOrder});

    const timeZone = user.role === 'MENTEE' ? sessions[0].mentee_id.timeZone : sessions[0].mentor_id.timeZone;
    //before sending data convert the time to local time
    
    sessions.forEach(session => {
        //@ts-ignore
        session.scheduled_time = convertSessionTimeToLocal(session.scheduled_time, timeZone);
        //@ts-ignore
        session.end_time = convertSessionTimeToLocal(session.end_time, timeZone);
    })

    const total = await Session.countDocuments(whereCondition);
    return {
        meta: {
            page,
            limit,
            total,
            totalPage: Math.ceil(total / limit)
        },
        data: sessions
    };
}

export const SessionService = {
    createSessionRequest,
    getSession,
    updateBookedSession,
    getSessionBookingsByUser
}