import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { AuthService } from './auth.service';
import ApiError from '../../../errors/ApiError';
import { jwtHelper } from '../../../helpers/jwtHelper';
import { User } from '../user/user.model';
import config from '../../../config';

const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const { ...verifyData } = req.body;
  const result = await AuthService.verifyEmailToDB(verifyData);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: result.message,
    data: result.data,
  });
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const { ...loginData } = req.body;
  const result = await AuthService.loginUserFromDB(loginData);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'User logged in successfully.',
    data: result.createToken,
  });
});

const logoutUser = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;  // User info comes from middleware

  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'User not found.');
  }

  // Remove refresh token from the database
  await User.findByIdAndUpdate(user.id, { refreshToken: null });

  // Update user status to inactive
  await User.findByIdAndUpdate(user.id, { status: 'inactive' });

  // Emit user status update event
  
    (global as any).io.emit('userStatusUpdated', { userId: user.id, status: 'inactive' });

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'User logged out successfully.',
  });
});
const refreshAccessToken = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Refresh token is required.');
  }

  // Verify the refresh token
  const decoded = jwtHelper.verifyToken(refreshToken, config.jwt.jwt_refresh_secret as string);
  if (!decoded) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid refresh token.');
  }

  // Find user with this refresh token
  const user = await User.findById(decoded.id);
  if (!user || user.refreshToken !== refreshToken) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Refresh token is not valid.');
  }

  // Generate a new access token
  const accessToken = jwtHelper.createToken(
    { id: user._id, role: user.role, email: user.email },
    config.jwt.jwt_secret as string,
    '15m'
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Access token refreshed successfully.',
    data: { accessToken },
  });
});

const forgetPassword = catchAsync(async (req: Request, res: Response) => {
  const email = req.body.email;
  const result = await AuthService.forgetPasswordToDB(email);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message:
      'Please check your email. We have sent you a one-time passcode (OTP).',
    data: result,
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const token = req.headers.authorization;
  const { ...resetData } = req.body;
  const result = await AuthService.resetPasswordToDB(token!, resetData);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Your password has been successfully reset.',
    data: result,
  });
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const { ...passwordData } = req.body;
  await AuthService.changePasswordToDB(user, passwordData);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Your password has been successfully changed',
  });
});

export const AuthController = {
  verifyEmail,
  loginUser,
  logoutUser,
  refreshAccessToken,
  forgetPassword,
  resetPassword,
  changePassword,
};
