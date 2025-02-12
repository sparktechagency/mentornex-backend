import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { IPlatformReview } from './platformReview.interface';
import { PlatformReviewModel } from './platformReview.model.';

const addPlatformReviewToDB = async (
  payload: IPlatformReview
): Promise<IPlatformReview> => {
  const addPlatformReview = await PlatformReviewModel.create(payload);
  if (!addPlatformReview) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to add Platform review');
  }
  return addPlatformReview;
};

const getAllPlatformReviewFromDB = async () => {
  const allReviews = await PlatformReviewModel.find()
    .populate({
      path: 'mentee_id',
      select: 'name',
    })
    .sort({ rate: -1 })
    .limit(10);

  if (!allReviews) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Platform reviews not found');
  }

  return allReviews;
};

const deleteReviewByMenteeFromDB = async (mentor_id: string) => {
  const review = await PlatformReviewModel.findOneAndDelete({ mentor_id });
  if (!review) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Review not found');
  }
  return review;
};

export const PlatformReview = {
  addPlatformReviewToDB,
  getAllPlatformReviewFromDB,
  deleteReviewByMenteeFromDB,
};
