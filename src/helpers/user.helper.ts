
import { JwtPayload } from "jsonwebtoken";
import { Types } from "mongoose";
import { PLAN_TYPE, PURCHASE_PLAN_STATUS } from "../app/modules/purchase/purchase.interface";
import { Purchase } from "../app/modules/purchase/purchase.model";
import { StatusCodes } from "http-status-codes";
import { IPackage, ISubscription } from '../app/modules/plans/plans.interface';
import ApiError from "../errors/ApiError";
import { Session } from "../app/modules/sessionBooking/session.model";
import { SESSION_STATUS } from "../app/modules/sessionBooking/session.interface";

export const getLatestActivePackageOrSubscription = async (id:Types.ObjectId) => {
    const [pkg, subscription] = await Promise.all([
        Purchase.findOne({mentee_id: id, plan_type: PLAN_TYPE.Package, plan_status: PURCHASE_PLAN_STATUS.ACTIVE}).populate<{package_id:Partial<IPackage>}>({path:'package_id', select:{_id:1, title:1, amount:1, quota:1, status:1}}).lean(),
        Purchase.findOne({mentee_id: id, plan_type: PLAN_TYPE.Subscription, plan_status: PURCHASE_PLAN_STATUS.ACTIVE}).populate<{subscription_id:Partial<ISubscription>}>({path:'subscription_id', select:{_id:1, title:1, amount:1, quota:1, status:1}}).lean(),
    ])

    if(pkg){
        //find package and see if the quota is over
        const totalSession = await Session.countDocuments({mentee_id: id, package_id: pkg._id, status: {$in:[SESSION_STATUS.ACCEPTED, SESSION_STATUS.COMPLETED]}}).lean();
        if(totalSession >= pkg.package_id!.sessions!) return null;
        return pkg;
    }

    if(subscription){
        //find subscription and see if the quota is over
        const totalSession = await Session.countDocuments({mentee_id: id, subscription_id: subscription._id, status: {$in:[SESSION_STATUS.ACCEPTED, SESSION_STATUS.COMPLETED]}}).lean();
        if(totalSession >= subscription.subscription_id!.sessions!) return null;
        return subscription;
    }

    return null;
}
