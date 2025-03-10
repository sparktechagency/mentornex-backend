import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiError";
import { User } from "../user/user.model";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { IPaginationOptions } from "../../../types/pagination";
import { IUserFilterableFields } from "../user/user.interface";
import { Subscription } from "../subscription/subscription.model";
import { USER_SEARCHABLE_FIELDS } from "../user/user.constants";
import { ReviewMentor } from "../menteeReviews/review.model";

const getAllMentorsFromDB = async (paginationOptions: IPaginationOptions, filterOptions: IUserFilterableFields) => {
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(paginationOptions);
    const { searchTerm, focus_area, expertise, language, minPrice, maxPrice } = filterOptions;
    const sortConditions: { [key: string]: 1 | -1 } = {};
    if (sortBy && sortOrder) {
        sortConditions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    }

    const anyCondition = [];

    if (minPrice && maxPrice) {
        // Get all the mentors based on the price from the subscription plan
        const subscription = await Subscription.find({
            plan_type: 'Subscription',
            amount: { $gte: minPrice, $lte: maxPrice }
        }).distinct('mentor_id');
        anyCondition.push({ _id: { $in: subscription } });
    }

    if (searchTerm) {
        anyCondition.push({
            $or: USER_SEARCHABLE_FIELDS.map(field => {
                if (Array.isArray(field)) {
                    // Handle the case where the field is an array
                    return { [field]: { $elemMatch: { $regex: searchTerm, $options: 'i' } } };
                } else {
                    // Handle regular fields (non-array)
                    return { [field]: { $regex: searchTerm, $options: 'i' } };
                }
            })
        });
    }

    if (focus_area) {
        anyCondition.push({ focus_area: { $in: focus_area } });
    }

    if (expertise) {
        anyCondition.push({ expertise: { $in: expertise } });
    }

    if (language) {
        anyCondition.push({ language: { $in: language } });
    }

    anyCondition.push({ role: 'MENTOR' });
    const whereCondition = anyCondition.length > 0 ? { $and: anyCondition } : {};

    const result = await User.find(whereCondition)
        .sort(sortConditions)
        .skip(skip)
        .limit(limit);

    const total = await User.countDocuments(whereCondition);

    // Get every mentor's review and rating, and also calculate top-rated mentors
    const mentorsWithReviews = await Promise.all(result.map(async (mentor) => {
        const reviews = await ReviewMentor.find({ mentor_id: mentor._id });
        const ratingCount = reviews.length;
        const rating = ratingCount > 0 ? reviews.reduce((acc, review) => acc + review.rate, 0) / ratingCount : 0;
        const topRated = rating > 4.5 && ratingCount >= 20;
        return { ...mentor.toObject(), rating, topRated };
    }));

    const mentorWithStartingPrices = await Promise.all(
        mentorsWithReviews.map(async (mentor) => {
            const subscription = await Subscription.findOne({
                mentor_id: mentor._id,
                plan_type: 'Subscription'
            })
                .sort({ amount: 1 })  
                .limit(1);  
            return { ...mentor, startingPrice: subscription ? subscription.amount : null };
        })
    );

    return {
        meta: {
            page,
            limit,
            total
        },
        data: mentorWithStartingPrices
    };
};

const getAllActiveMentorsFromDB = async(paginationOptions: IPaginationOptions)=>{
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(paginationOptions);

    const sortConditions: { [key: string]: 1 | -1 } = {};
    if (sortBy && sortOrder) {
        sortConditions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    }

    const result = await User.find({role: 'MENTOR', status: 'active'})
        .sort(sortConditions)
        .skip(skip)
        .limit(limit);

    const total = await User.countDocuments({role: 'MENTOR', status: 'active'});

    if(!result.length){
        throw new ApiError(StatusCodes.NOT_FOUND, 'No active mentors found');
    }
    
    return {
        meta: {
            page,
            limit,
            total
        },
        data: result
    };
}

export const MentorService = {
    getAllMentorsFromDB,
    getAllActiveMentorsFromDB
}