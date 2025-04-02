import { Types } from "mongoose";
import { Purchase } from "../purchase/purchase.model";
import ApiError from "../../../errors/ApiError";
import { StatusCodes } from "http-status-codes";
import { IPackage, ISubscription, PLAN_STATUS } from "../plans/plans.interface";
import { PAYMENT_STATUS } from "../purchase/purchase.interface";
import { PLAN_TYPE } from "../purchase/purchase.interface";
import { Session } from "./session.model";
import { ISession, SESSION_STATUS } from "./session.interface";
import { Schedule } from "../mentorSchedule/schedule.model";
import { DateTime } from "luxon";
import { calculateEndTime, convertSessionTimeToLocal, convertSessionTimeToUTC } from "../../../helpers/date.helper";
import sendNotification, { sendDataWithSocket } from "../../../helpers/sendNotificationHelper";

export const getActivePackageOrSubscription = async (menteeId: Types.ObjectId,mentorId: Types.ObjectId, packageId?: Types.ObjectId, subscriptionId?: Types.ObjectId) => {

    if(packageId){
        const pkg = await Purchase.findOne({ mentee_id: menteeId, mentor_id: mentorId, package_id: new Types.ObjectId(packageId), status: PAYMENT_STATUS.PAID, is_active: true }).populate<{package_id:Partial<IPackage>}>({path:'package_id', select:{_id:1, title:1, amount:1, sessions:1, status:1}}).lean();
        return pkg;
    }
    if(subscriptionId){
        const subscription = await Purchase.findOne({ mentee_id: menteeId, mentor_id: mentorId, subscription_id: new Types.ObjectId(subscriptionId), status: PAYMENT_STATUS.PAID, is_active: true }).populate<{subscription_id:Partial<ISubscription>}>({path:'subscription_id', select:{_id:1, title:1, amount:1, sessions:1, status:1}}).lean();
        return subscription;
    }

    return null;
}


export const getRemainingQuotaForPackageOrSubscription = async (menteeId: Types.ObjectId, mentorId: Types.ObjectId, packageId?: Types.ObjectId, subscriptionId?: Types.ObjectId) => {
    console.log(menteeId, mentorId, packageId, subscriptionId);
    const test = await Session.find({ mentee_id: new Types.ObjectId(menteeId), mentor_id: new Types.ObjectId(mentorId), status: { $in: [SESSION_STATUS.ACCEPTED, SESSION_STATUS.RESCHEDULED, SESSION_STATUS.COMPLETED] }, package_id: new Types.ObjectId(packageId) });
    console.log(test);
    if(packageId){
        const value = await Session.countDocuments({ mentee_id: new Types.ObjectId(menteeId), mentor_id: new Types.ObjectId(mentorId), status: { $in: [SESSION_STATUS.ACCEPTED, SESSION_STATUS.RESCHEDULED, SESSION_STATUS.COMPLETED] }, package_id: new Types.ObjectId(packageId) });
        return value;
    }
    if(subscriptionId){
        return await Session.countDocuments({ mentee_id: new Types.ObjectId(menteeId), mentor_id: new Types.ObjectId(mentorId), status: { $in: [SESSION_STATUS.ACCEPTED, SESSION_STATUS.RESCHEDULED, SESSION_STATUS.COMPLETED] }, subscription_id: new Types.ObjectId(subscriptionId) });
    }

   return 0;
}

export const isSlotAvailable = async (
    mentorId: Types.ObjectId,
    sessionStartTime: Date,
    sessionEndTime: Date,
    duration: number
): Promise<boolean> => {
    try {

        const overlappingSessions = await Session.countDocuments({
            mentor_id: mentorId,
            $and: [
              {scheduled_time: { $lte: sessionEndTime }},
              {end_time: { $gte: sessionStartTime }}
            ],
            status: { $in: [SESSION_STATUS.ACCEPTED, SESSION_STATUS.PENDING, SESSION_STATUS.RESCHEDULED] } // Only check against accepted sessions
        });
        console.log(overlappingSessions)
        return overlappingSessions === 0;
    } catch (error) {
        console.error('Error checking slot availability:', error);
        throw error;
    }
};


export const handleNotificationAndDataSendForSocket = async(sender: string, receiver: string, status: SESSION_STATUS, sessionId?:string, session?:any ) => {

    let sessionData = session ? session : null;

    if(!sessionData){
        sessionData = await Session.findById(new Types.ObjectId(sessionId)).populate<{mentee_id: {name: string, timeZone: string, _id: Types.ObjectId}}>('mentee_id', 'name timeZone _id').populate<{mentor_id: {name: string, timeZone: string, _id: Types.ObjectId}}>('mentor_id', 'name timeZone _id').lean();
        if(!sessionData){
            throw new ApiError(StatusCodes.NOT_FOUND, 'Session not found');
        }
    }
   
    const generateNotificationData = (sender: string, receiver: string, status: SESSION_STATUS, topic: string,date:Date,  timeZone: string, message?: string)=>{

        // @ts-ignore
        const senderName = sessionData?.mentee_id.name as string;
        // @ts-ignore
        const receiverName = sessionData?.mentor_id.name as string;
    
        return {
            senderId: sender,
            receiverId: receiver,
            title: `${status === SESSION_STATUS.PENDING ? `You have a new session request from ${senderName}` : `Your session request has been ${status} by ${senderName}`}`,
           message: `${status === SESSION_STATUS.PENDING ? `You have a new session request from ${senderName} at ${convertSessionTimeToLocal(date, timeZone)} on ${topic}, please respond to accept or reject` : `Your session request has been ${status} by ${senderName} at ${convertSessionTimeToLocal(date, timeZone)} on ${topic}. ${message ? 'Cancellation reason: ' + message : ''}`}`,
        }

    }

    const receiverIds = [sessionData?.mentee_id._id.toString(), sessionData?.mentor_id._id.toString()];
    receiverIds.forEach(id => {
        console.log(id)
        sendDataWithSocket(`sessions`, id, sessionData);
    });

    // @ts-ignore
    const receiverTimeZone = sessionData?.mentor_id.timeZone;
    await sendNotification('getNotification', generateNotificationData(sender, receiver, status, sessionData?.topic!, sessionData?.scheduled_time!, receiverTimeZone!, sessionData?.cancel_reason));


}

