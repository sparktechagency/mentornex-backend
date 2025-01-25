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

const deleteReviewByMenteeFromDB = async (mentee_id: string, mentor_id: string) => {
    const review = await ReviewMentor.findOneAndDelete({ mentee_id, mentor_id });
    if (!review) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Review not found');
    }
    return review;
};

export const ReviewService = {
    addReviewToDB,
    getAllMentorsReviewFromDB,
    deleteReviewByMenteeFromDB
};