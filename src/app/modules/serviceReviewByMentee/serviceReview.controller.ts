import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { ServiceReview } from "./serviceReview.service";

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
        const serviceReview = {mentee_id,  ...req.body};
        const result = await ServiceReview.addServiceReviewToDB(serviceReview);
    
        sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Mentor review added successfully',
          data: result,
        });
      }

  );

  const getAllReviews = catchAsync(
    async (req: Request, res: Response) => {
      const result = await ServiceReview.getAllServiceReviewFromDB();
      sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Mentor reviews retrieved successfully',
        data: result,
      });
    }
  );

const deleteReviewByMentee = catchAsync(
  async (req: Request, res: Response) => {
    const mentee_id = req.user.id;
    const result = await ServiceReview.deleteReviewByMenteeFromDB(mentee_id);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Review deleted successfully',
      data: result,
    });
  }
)


  export const ServiceReviewController = { addReviewMentorbyMentee , getAllReviews, deleteReviewByMentee };