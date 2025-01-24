import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiError";
import { IReview } from "./review.interface";
import { ReviewMentor } from "./review.model";


const addReviewToDB = async (payload: IReview): Promise<IReview> => {
    const addReview = await ReviewMentor.create(payload);
    if (!addReview) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to add review');
    }
    return addReview;
};

const getAllMentorsReviewFromDB = async (mentor_id: string) => {
    const allReviews = await ReviewMentor.find({ mentor_id })

    if (!allReviews) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Mentors reviews not found');
    }

    return allReviews;
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
    getAllMentorsReviewFromDB,
    deleteFavoriteMentorFromDB
};