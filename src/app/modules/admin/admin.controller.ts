import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import { getSingleFilePath } from '../../../shared/getFilePath';
import sendResponse from '../../../shared/sendResponse';
import { AdminService } from './admin.service';
import ApiError from '../../../errors/ApiError';

const createAdmin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { ...adminData } = req.body;
    const result = await AdminService.createAdminToDB(adminData);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Admin created successfully',
      data: result,
    });
  }
);

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
  async (req: Request, res: Response, next: NextFunction) => {
    const adminId = req.params.id;
    let image = getSingleFilePath(req.files, 'image');

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
  async (req: Request, res: Response, next: NextFunction) => {
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

const getTotalMentor = catchAsync(async (req: Request, res: Response) => {
  const [totalMentors, totalActiveMentors, totalInactiveMentors] =
    await Promise.all([
      AdminService.getTotalMentorFromDB(),
      AdminService.getTotalActiveMentorFromDB(),
      AdminService.getTotalInactiveMentorFromDB(),
    ]);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Total Mentor retrieved successfully',
    data: {
      totalMentors,
      totalActiveMentors,
      totalInactiveMentors,
    },
  });
});
const getTotalMentee = catchAsync(async (req: Request, res: Response) => {
  const [totalMentees, totalActiveMentees, totalInactiveMentees] =
    await Promise.all([
      AdminService.getTotalMenteeFromDB(),
      AdminService.getTotalActiveMenteeFromDB(),
      AdminService.getTotalInactiveMenteeFromDB(),
    ]);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Total Mentee retrieved successfully',
    data: {
      totalMentees,
      totalActiveMentees,
      totalInactiveMentees,
    },
  });
});

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
const updateProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    let image = getSingleFilePath(req.files, 'image');

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
  }
);

const getAllTransactionForMentor = catchAsync(
  async (req: Request, res: Response) => {
    const mentorId = req.user.id;
    const result = await AdminService.getAllTransactionForMentorFromDB(
      mentorId
    );
    if (!result) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Transaction not found');
    }
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Transaction retrieved successfully',
      data: result,
    });
  }
);

const getAllTransactionForMentee = catchAsync(
  async (req: Request, res: Response) => {
    const menteeId = req.user.id;
    const result = await AdminService.getAllTransactionForMenteeFromDB(
      menteeId
    );
    if (!result) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Transaction not found');
    }
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Transaction retrieved successfully',
      data: result,
    });
  }
);

export const AdminController = {
  createAdmin,
  getAllAdmin,
  updateAdminBySuperAdmin,
  getUserProfile,
  updateProfile,
  deleteAdminBySuperAdmin,
  getTotalMentor,
  getTotalMentee,
  getAllTransactionForMentor,
  getAllTransactionForMentee
};
