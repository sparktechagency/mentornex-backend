import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { NotificationService } from './notification.service';
import pick from '../../../shared/pick';
import { paginationConstants } from '../../../types/pagination';

const getNotifications = catchAsync(async (req, res) => {
  const pagination = pick(req.query, paginationConstants);

  const result = await NotificationService.getAllNotifications(
    req.user,
    pagination
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Notifications fetched successfully',
    data: result,
  });
});

const updateNotification = catchAsync(async (req, res) => {
  const result = await NotificationService.updateNotification();
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Notification updated successfully',
    data: result,
  });
});

export const NotificationController = {
  getNotifications,
  updateNotification,
};
