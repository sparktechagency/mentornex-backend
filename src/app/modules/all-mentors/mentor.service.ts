import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiError";
import { User } from "../user/user.model";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { IPaginationOptions } from "../../../types/pagination";
import { IUserFilterableFields } from "../user/user.interface";
import { Subscription } from "../subscription/subscription.model";
import { USER_SEARCHABLE_FIELDS } from "../user/user.constants";
import { ReviewMentor } from "../menteeReviews/review.model";
import { PaymentRecord } from "../payment-record/payment-record.model";

const getAllMentorsFromDB = async (paginationOptions: IPaginationOptions, filterOptions: IUserFilterableFields) => {
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(paginationOptions);
    const { searchTerm, focus_area, expertise, language, minPrice, maxPrice } = filterOptions;

    // Sort conditions
    const sortConditions: { [key: string]: 1 | -1 } = {
        ...(sortBy.toLocaleLowerCase() === 'newest' && { createdAt: -1 }),
        ...(sortBy.toLocaleLowerCase() === 'alphabetically' && { name: 1 })
    };


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

    const result = await User.find(whereCondition).populate({
        path:"industry",
        select:{name:1, image:1}
      })
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

    // Sort by amount if required
    if (sortBy.toLocaleLowerCase() === 'amount') {
        mentorWithStartingPrices.sort((a, b) => {
            const priceA = a.startingPrice || Infinity; // Handle null values
            const priceB = b.startingPrice || Infinity; // Handle null values
                return priceA - priceB; 
            });
        }

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

    const result = await User.find({role: 'MENTOR', status: 'active'}).populate({
        path:"industry",
        select:{name:1, image:1}
      })
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

const getSingleMentor = async (id: string) => {
    // Check if the mentor exists
    const isExist = await User.findById(id).populate({
        path:"industry",
        select:{name:1, image:1}
      }).lean();
    if (!isExist) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Mentor not found');
    }

  

    // Count total repeated user sessions
    const [
        totalSessionCount,
        repeatedUserSessions,
        goalAchievingRate
      ] = await Promise.all([
        // Get total session count
        PaymentRecord.countDocuments({ mentor_id: id, status: 'succeeded' }),
  
        // Count total repeated user sessions
        PaymentRecord.aggregate([
          { $match: { mentor_id: id, status: 'succeeded' } },
          { $group: { _id: "$user_id", sessionCount: { $sum: 1 } } },
          { $match: { sessionCount: { $gt: 1 } } },
          { $count: "repeatedUserCount" }
        ]),
  
        // Calculate goal achieving rate from the review collection
        ReviewMentor.aggregate([
          { $match: { mentor_id: id } },
          { $group: { _id: null, totalGoalAchieved: { $sum: "$goalAchieved" }, totalReviews: { $sum: 1 } } },
          { $project: {
              goalAchievingRate: {
                $cond: {
                  if: { $eq: ["$totalReviews", 0] },
                  then: 0,
                  else: { $multiply: [{ $divide: ["$totalGoalAchieved", "$totalReviews"] }, 100] }
                }
              }
            }
          }
        ])
      ]);

    // Extract the repeated user count (default to 0 if no repeated sessions)
    const repeatedUserCount = repeatedUserSessions.length > 0 ? repeatedUserSessions[0].repeatedUserCount : 0;

    return {
        ...isExist,
        totalSessionCount,
        repeatedUserCount,
        goalAchievingRate: goalAchievingRate[0]?.goalAchievingRate || 0
    };
};

export const MentorService = {
    getAllMentorsFromDB,
    getAllActiveMentorsFromDB,
    getSingleMentor
}