import { NextFunction, Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import {  ReviewService } from "./review.service";


const addReviewMentorbyMentee = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const mentee_id = req.user.id;
      const reviewMentor = {mentee_id, ...req.body};
      const result = await ReviewService.addReviewToDB(reviewMentor);
  
      sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Mentor review added successfully',
        data: result,
      });
    }
  );

const getAllReviewsByMentor = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const mentor_id = req.user.id;
    const allReviews = await ReviewService.getAllMentorsReviewFromDB(mentor_id);

    const averageRating = (allReviews.reduce((sum, review) => sum + review.rate, 0) / allReviews.length).toFixed(1);

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
  }
)


  export const ReviewController = { addReviewMentorbyMentee, getAllReviewsByMentor };