import { JwtPayload } from 'jsonwebtoken';
import { Notification } from './notification.model';
import { IPaginationOptions } from '../../../types/pagination';
import { paginationHelper } from '../../../helpers/paginationHelper';

const getAllNotifications = async (
  user: JwtPayload,
  pagination: IPaginationOptions
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(pagination);

  const result = await Notification.find()
    .populate({
      path: 'senderId',
      select: { name: 1, image: 1 },
    })
    .skip(skip)
    .limit(limit!)
    .sort({ [sortBy]: sortOrder });

  const total = await Notification.countDocuments();

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

const updateNotification = async () => {
  const result = await Notification.updateMany(
    { read: false },
    { $set: { read: true } },
    { new: true }
  );
  return result;
};

export const NotificationService = {
  getAllNotifications,
  updateNotification,
};
