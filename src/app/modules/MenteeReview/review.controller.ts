import { NextFunction, Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import {  ReviewService } from "./review.service";


const addReviewMentor = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const mentee_id = req.user.id;
      const favoriteMentorData = {mentee_id, ...req.body};
      const result = await ReviewService.addReviewToDB(favoriteMentorData);
  
      sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Favorite mentor added successfully',
        data: result,
      });
    }
  );


  export const ReviewController = { addReviewMentor };