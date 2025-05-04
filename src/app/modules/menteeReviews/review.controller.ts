import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { ReviewService } from './review.service';
import pick from '../../../shared/pick';
import { paginationConstants } from '../../../types/pagination';

const addReviewMentorbyMentee = catchAsync(
  async (req: Request, res: Response) => {
    const mentee_id = req.user.id;
    const mentor_id = req.params.mentor_id;
    const reviewMentor = { mentee_id, mentor_id, ...req.body };
    const result = await ReviewService.addReviewToDB(reviewMentor);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Mentor review added successfully',
      data: result,
    });
  }
);

const getMyReviews = catchAsync(async (req: Request, res: Response) => {
  const allReviews = await ReviewService.getMyReviews(req.user);

  const averageRating =
    allReviews.reduce((sum, review) => sum + Number(review.rate), 0) /
      allReviews.length || 0;

  const result = {
    averageRating,
    allReviews,
  };

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Mentors reviews and average rating fetched successfully',
    data: result,
  });
});

const deleteReviewByMentee = catchAsync(async (req: Request, res: Response) => {
  const mentee_id = req.user.id;
  const mentor_id = req.params.mentor_id;
  const result = await ReviewService.deleteReviewByMenteeFromDB(
    mentee_id,
    mentor_id
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Review deleted successfully',
    data: result,
  });
});

const getAllMentorForMentee = catchAsync(
  async (req: Request, res: Response) => {
    const pagination = pick(req.query, paginationConstants);
    const filters = pick(req.query, ['searchTerm']);
    const result = await ReviewService.getAllMentorForMentee(
      req.user,
      filters,
      pagination
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Mentor list fetched successfully',
      data: result,
    });
  }
);

const getAvailableContent = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewService.getAvailableContent(
    req.user,
    req.params.mentor_id
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Content list fetched successfully',
    data: result,
  });
});

export const ReviewController = {
  addReviewMentorbyMentee,
  getMyReviews,
  deleteReviewByMentee,
  getAllMentorForMentee,
  getAvailableContent,
};
