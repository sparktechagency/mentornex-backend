import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import {  ReviewService } from "./review.service";


const addReviewMentorbyMentee = catchAsync(
    /*async (req: Request, res: Response) => {
      const mentee_id = req.user.id;
      const reviewMentor = {mentee_id, ...req.body};
      const result = await ReviewService.addReviewToDB(reviewMentor);
  
      sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Mentor review added successfully',
        data: result,
      });
    }*/
      async (req: Request, res: Response) => {
        const mentee_id = req.user.id;
        const mentor_id = req.params.mentor_id;
        const reviewMentor = {mentee_id, mentor_id, ...req.body};
        const result = await ReviewService.addReviewToDB(reviewMentor);

        if (!result) {
          sendResponse(res, {
            success: false,
            statusCode: StatusCodes.NOT_FOUND,
            message: 'Could not add Mentor review',
          });
          return;
        }
    
        sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Mentor review added successfully',
          data: result,
        });
      }

  );

const getAllReviewsByMentor = catchAsync(
  async (req: Request, res: Response) => {
    const mentor_id = req.user.id;
    const allReviews = await ReviewService.getAllMentorsReviewFromDB(mentor_id);

    const averageRating = (allReviews.reduce((sum, review) => sum + review.rate, 0) / allReviews.length).toFixed(1);

    const result = {
      averageRating,
      allReviews,
    };

    if (!allReviews) {
      sendResponse(res, {
        success: false,
        statusCode: StatusCodes.NOT_FOUND,
        message: 'Could not fetch Mentors reviews and average rating',
      });
      return;
    }

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Mentors reviews and average rating fetched successfully',
      data: result,
    });
  }
)

const deleteReviewByMentee = catchAsync(
  async (req: Request, res: Response) => {
    const mentee_id = req.user.id;
    const mentor_id = req.params.mentor_id;
    const result = await ReviewService.deleteReviewByMenteeFromDB(mentee_id, mentor_id);

    if (!result) {
      sendResponse(res, {
        success: false,
        statusCode: StatusCodes.NOT_FOUND,
        message: 'Could not delete review',
      });
      return;
    }
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Review deleted successfully',
      data: result,
    });
  }
)


  export const ReviewController = { addReviewMentorbyMentee, getAllReviewsByMentor , deleteReviewByMentee };