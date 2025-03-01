import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiError";
import { User } from "../user/user.model";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { IPaginationOptions } from "../../../types/pagination";

const getAllMentorsFromDB = async(paginationOptions: IPaginationOptions)=>{
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(paginationOptions);

    const sortConditions: { [key: string]: 1 | -1 } = {};
    if (sortBy && sortOrder) {
        sortConditions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    }

    const result = await User.find({role: 'MENTOR'})
        .sort(sortConditions)
        .skip(skip)
        .limit(limit);

    const total = await User.countDocuments({role: 'MENTOR'});

    if(!result.length){
        throw new ApiError(StatusCodes.NOT_FOUND, 'No mentors found');
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