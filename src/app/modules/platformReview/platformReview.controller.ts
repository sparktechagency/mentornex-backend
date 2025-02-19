import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { PlatformReview } from "./platformReview.service";

const addReviewbyMentee = catchAsync(
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
        const platformReview = {mentee_id,  ...req.body};
        const result = await PlatformReview.addPlatformReviewToDB(platformReview);

        if(!result){
          sendResponse(res, {
            success: false,
            statusCode: StatusCodes.NOT_FOUND,
            message: 'Failed to add review',
            data: null,
          });
        }
    
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
      const result = await PlatformReview.getAllPlatformReviewFromDB();

      if(!result){
        sendResponse(res, {
          success: false,
          statusCode: StatusCodes.NOT_FOUND,
          message: 'Failed to retrieve reviews',
          data: null,
        });
      }
      sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Platform reviews retrieved successfully',
        data: result,
      });
    }
  );

const deleteReviewByMentee = catchAsync(
  async (req: Request, res: Response) => {
    const mentee_id = req.user.id;
    const result = await PlatformReview.deleteReviewByMenteeFromDB(mentee_id);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Review deleted successfully',
      data: result,
    });
  }
)


  export const PlatformReviewController = { addReviewbyMentee , getAllReviews, deleteReviewByMentee };