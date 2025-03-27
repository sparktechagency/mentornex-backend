import { Types } from "mongoose";
import { Purchase } from "../purchase/purchase.model";
import ApiError from "../../../errors/ApiError";
import { StatusCodes } from "http-status-codes";
import { PLAN_STATUS } from "../plans/plans.interface";
import { PAYMENT_STATUS } from "../purchase/purchase.interface";
import { PLAN_TYPE } from "../purchase/purchase.interface";

export const getActivePackageOrSubscription = async (menteeId: Types.ObjectId) => {
    const [pkg, subscription] = await Promise.all([
        Purchase.findOne({ mentee_id: menteeId, status: PAYMENT_STATUS.PAID, plan_status: PLAN_STATUS.ACTIVE, is_active: true, plan_type: PLAN_TYPE.Package }).lean(),
        Purchase.findOne({ mentee_id: menteeId, status: PAYMENT_STATUS.PAID, plan_status: PLAN_STATUS.ACTIVE, is_active: true, plan_type: PLAN_TYPE.Subscription }).lean()
    ]);
    if (!pkg && !subscription) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'You are not authorized to purchase this session.');
    }
    return { pkg, subscription };
}
