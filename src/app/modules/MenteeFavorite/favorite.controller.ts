import { NextFunction, Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { FavoriteService } from "./favorite.service";
import ApiError from "../../../errors/ApiError";


const addfavoriteMentor = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const mentee_id = req.user.id;
      const favoriteMentorData = {mentee_id, ...req.body};
      const result = await FavoriteService.addFavoriteToDB(favoriteMentorData);
  
      sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Favorite mentor added successfully',
        data: result,
      });
    }
  );

const getFavoriteMentors = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const mentee_id = req.user.id;
      const result = await FavoriteService.getFavoriteMentorsFromDB(mentee_id);

      sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Favorite mentors retrieved successfully',
        data: result,
      });
    }
)

const deleteFavoriteMentor = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const mentee_id = req.user.id;
      const { mentor_id } = req.body;

    if (!mentor_id) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Mentor ID is required');
    }

    const result = await FavoriteService.deleteFavoriteMentorFromDB(mentee_id, mentor_id);

      sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Favorite mentor deleted successfully',
        data: result,
      });
    }
)

  export const FavoriteController = { addfavoriteMentor, getFavoriteMentors, deleteFavoriteMentor };