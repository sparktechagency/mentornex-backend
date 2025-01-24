import { NextFunction, Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { FavoriteService } from "./favorite.service";
import ApiError from "../../../errors/ApiError";


const favoriteMentor = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const mentee_id = req.user.id;
    const { mentor_ids }: { mentor_ids: string[] } = req.body;

    if (!mentor_ids || !Array.isArray(mentor_ids)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Mentor IDs must be an array');
    }

    const favoriteMentorData = { mentee_id, mentor: mentor_ids };
    const result = await FavoriteService.addOrRemoveFavoriteToDB(favoriteMentorData);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Favorite mentors updated successfully',
      data: result,
    });
  }
);

const getFavoriteMentorsController = catchAsync(
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
      const menteeId = req.user.id;
      const mentors = await FavoriteService.getFavoriteMentors(menteeId);
  
      sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Favorite mentors retrieved successfully',
        data: mentors,
      });
  }
) 

export const FavoriteController = { favoriteMentor, getFavoriteMentorsController };