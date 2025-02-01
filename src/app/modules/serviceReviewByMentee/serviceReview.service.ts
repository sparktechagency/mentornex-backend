import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { IServiceReview } from './serviceReview.interface';
import { ServiceReviewModel } from './serviceReview.model';

const addServiceReviewToDB = async (
  payload: IServiceReview
): Promise<IServiceReview> => {
  const addServiceReview = await ServiceReviewModel.create(payload);
  if (!addServiceReview) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to add service review');
  }
  return addServiceReview;
};

const getAllServiceReviewFromDB = async () => {
  const allReviews = await ServiceReviewModel.find()
    .populate({
      path: 'mentee_id',
      select: 'name',
    })
    .sort({ rate: -1 })
    .limit(10);

  if (!allReviews) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Service reviews not found');
  }

  return allReviews;
};

const deleteReviewByMenteeFromDB = async (mentee_id: string) => {
  const review = await ServiceReviewModel.findOneAndDelete({ mentee_id });
  if (!review) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Review not found');
  }
  return review;
};

export const ServiceReview = {
  addServiceReviewToDB,
  getAllServiceReviewFromDB,
  deleteReviewByMenteeFromDB,
};
