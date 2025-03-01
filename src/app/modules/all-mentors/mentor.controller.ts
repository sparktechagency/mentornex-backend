import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { MentorService } from "./mentor.service";
import pick from "../../../shared/pick";

const getAllMentors = catchAsync(
    async (req: Request, res: Response) => {
      const paginationOptions = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);
      const result = await MentorService.getAllMentorsFromDB(paginationOptions);

      sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'All mentors retrieved successfully',
        data: {
          mentors: result.data,
          pagination: result.meta
        },
      });
    }
  );

  const getAllActiveMentors = catchAsync(
    async (req: Request, res: Response) => {
      const paginationOptions = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);
      const result = await MentorService.getAllActiveMentorsFromDB(paginationOptions);

      sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'All active mentors retrieved successfully',
        data: {
          mentors: result.data,
          pagination: result.meta
        },
      });
    }
  );

  export const MentorController = {
    getAllMentors,
    getAllActiveMentors
  };