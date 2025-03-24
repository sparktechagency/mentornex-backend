import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { MentorService } from "./mentor.service";
import pick from "../../../shared/pick";
import { USER_FILTERABLE_FIELDS } from "../user/user.constants";

const getAllMentors = catchAsync(
    async (req: Request, res: Response) => {
      const paginationOptions = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);
      const filterOptions = pick(req.query, USER_FILTERABLE_FIELDS);
      const result = await MentorService.getAllMentorsFromDB(paginationOptions, filterOptions);

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

//   const getAllActiveMentors = catchAsync(
//     async (req: Request, res: Response) => {
//       const paginationOptions = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);
//       const result = await MentorService.getAllActiveMentorsFromDB(paginationOptions);

//       sendResponse(res, {
//         success: true,
//         statusCode: StatusCodes.OK,
//         message: 'All active mentors retrieved successfully',
//         data: {
//           mentors: result.data,
//           pagination: result.meta
//         },
//       });
//     }
//   );


  const getSingleMentor = catchAsync(
    async (req: Request, res: Response) => {
      const { id } = req.params;
      const result = await MentorService.getSingleMentor(id);

      sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Mentor retrieved successfully',
        data: result
      });
    }
  );

const onboardMentorToStripe = catchAsync(
    async (req: Request, res: Response) => {
      const result = await MentorService.onboardMentorToStripe(req.user);

      sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Mentor onboarded to Stripe successfully',
        data: result
      });
    }
  );

  const createStripeLoginLink = catchAsync(
    async (req: Request, res: Response) => {
      const result = await MentorService.createStripeLoginLink(req.user);

      sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Stripe login link created successfully',
        data: result
      });
    }
  );


  const getMenteeByMentor = catchAsync(
    async (req: Request, res: Response) => {
      const filters = pick(req.query, ['searchTerm']);
      const paginationOptions = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);
      const result = await MentorService.getMenteeByMentor(req.user, paginationOptions, filters);

      sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Mentees retrieved successfully',
        data: result
      });
    }
  );

  export const MentorController = {
    getAllMentors,
    // getAllActiveMentors,
    getSingleMentor,
    onboardMentorToStripe,
    createStripeLoginLink,
    getMenteeByMentor
  };