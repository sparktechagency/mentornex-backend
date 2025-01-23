import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiError";
import { IReview } from "./review.interface";
import { ReviewMentor } from "./review.model";


const addReviewToDB = async (payload: IReview): Promise<IReview> => {
    //set role
    //payload.role = USER_ROLES.USER;
    const addReview = await ReviewMentor.create(payload);
    if (!addReview) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to add review');
    }
    return addReview;
};

const getFavoriteMentorsFromDB = async (mentee_id: string) => {
    const favoriteMentors = await ReviewMentor.find({ mentee_id }).populate({
        path: 'mentor_id'
      })
      .exec();
    return favoriteMentors;
};

const deleteFavoriteMentorFromDB = async (mentee_id: string, mentor_id: string) => {
    const favoriteMentor = await ReviewMentor.findOneAndDelete({ mentee_id, mentor_id });
    if (!favoriteMentor) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Favorite mentor not found');
    }
    return favoriteMentor;
};

export const ReviewService = {
    addReviewToDB,
    getFavoriteMentorsFromDB,
    deleteFavoriteMentorFromDB
};