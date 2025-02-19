import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiError";
import { FavoriteService } from "./favorite.service";


const favoriteMentor = catchAsync(
  async (req: Request, res: Response) => {
    const mentee_id = req.user.id;
    const { mentor_ids }: { mentor_ids: string[] } = req.body;

    //const mentor_ids = req.params.mentor_ids; //mentor_ids is an array  of strings

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
    res: Response
  ) => {
      const menteeId = req.user.id;
      const mentors = await FavoriteService.getFavoriteMentors(menteeId);

      if(!mentors){
        throw new ApiError(StatusCodes.NOT_FOUND, 'Favorite Mentors not found');
      }
  
      sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Favorite mentors retrieved successfully',
        data: mentors,
      });
  }
) 

export const FavoriteController = { favoriteMentor, getFavoriteMentorsController };