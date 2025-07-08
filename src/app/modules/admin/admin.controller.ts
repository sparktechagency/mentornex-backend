import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import { getSingleFilePath } from '../../../shared/getFilePath';
import sendResponse from '../../../shared/sendResponse';
import { AdminService } from './admin.service';
import ApiError from '../../../errors/ApiError';
import pick from '../../../shared/pick';
import { paginationConstants } from '../../../types/pagination';
import { USER_FILTERABLE_FIELDS } from '../user/user.constants';
import { USER_ROLES } from '../../../enums/user';

const createAdmin = catchAsync(async (req: Request, res: Response) => {
  const { ...adminData } = req.body;
  const result = await AdminService.createAdminToDB(adminData);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Admin created successfully',
    data: result,
  });
});

const getAllAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getAllAdminFromDB();
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Admin retrieved successfully',
    data: result,
  });
});

const updateAdminBySuperAdmin = catchAsync(
  async (req: Request, res: Response) => {
    const adminId = req.params.id;
    const image = getSingleFilePath(req.files, 'image');

    const data = {
      image,
      ...req.body,
    };
    const result = await AdminService.updateAdminBySuperAdminToDB(
      adminId,
      data
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Admin updated successfully',
      data: result,
    });
  }
);

const deleteAdminBySuperAdmin = catchAsync(
  async (req: Request, res: Response) => {
    const adminId = req.params.id;
    const result = await AdminService.deleteAdminBySuperAdminToDB(adminId);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Admin deleted successfully',
      data: result,
    });
  }
);

const getUserProfile = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const result = await AdminService.getUserProfileFromDB(user);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Profile data retrieved successfully',
    data: result,
  });
});

//update profile
const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const image = getSingleFilePath(req.files, 'image');

  const data = {
    image,
    ...req.body,
  };
  const result = await AdminService.updateProfileToDB(user, data);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Profile updated successfully',
    data: result,
  });
});

const getMentorAndMenteeCountStats = catchAsync(
  async (req: Request, res: Response) => {
    const result = await AdminService.getMentorAndMenteeCountStats(
      Number(req.query.year)
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Mentor and mentee count retrieved successfully',
      data: result,
    });
  }
);

const getEarningStats = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getEarningStats(Number(req.query.year));

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Earning stats retrieved successfully',
    data: result,
  });
});
const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getDashboardStats(Number(req.query.year));

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Dashboard stats retrieved successfully',
    data: result,
  });
});

const getMentorOrMentee = catchAsync(async (req: Request, res: Response) => {
  const pagination = pick(req.query, paginationConstants);
  const filters = pick(req.query, USER_FILTERABLE_FIELDS);
  const result = await AdminService.getMentorOrMentee(filters, pagination);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Mentor and mentee count retrieved successfully',
    data: result,
  });
});

const getUserStats = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getUserStats(
    req.query.role as USER_ROLES,
    Number(req.query.year)
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'User stats retrieved successfully',
    data: result,
  });
});

export const AdminController = {
  createAdmin,
  getAllAdmin,
  updateAdminBySuperAdmin,
  getUserProfile,
  updateProfile,
  deleteAdminBySuperAdmin,
  //ADMIN DASHBOARD API'S
  getMentorAndMenteeCountStats,
  getEarningStats,
  getDashboardStats,
  getMentorOrMentee,
  getUserStats,
};
