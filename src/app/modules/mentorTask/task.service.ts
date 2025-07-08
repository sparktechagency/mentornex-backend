import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { ITask } from './task.interface';
import { Task } from './task.model';
import { User } from '../user/user.model';
import unlinkFile from '../../../shared/unlinkFile';
import { onlineUsers } from '../../../server';
import { Notification } from '../notification/notification.model';
import { socketHelper } from '../../../helpers/socketHelper';
import { JwtPayload } from 'jsonwebtoken';
import { Types } from 'mongoose';
import { IPaginationOptions } from '../../../types/pagination';
import { paginationHelper } from '../../../helpers/paginationHelper';
import sendNotification from '../../../helpers/sendNotificationHelper';
import { logger } from '../../../shared/logger';

const addTaskToDB = async (payload: ITask): Promise<ITask> => {
  const addTask = await Task.create(payload);
  const isMentorExist = await User.isExistUserById(payload.mentor_id.toString());
  if (!isMentorExist) {
    if (payload.file) {
      unlinkFile(payload.file);
    }
    throw new ApiError(StatusCodes.NOT_FOUND, 'Mentor not found');
  }
  if (!addTask) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to add Task');
  }


  try{
   await sendNotification(payload.mentee_id.toString(), {
    senderId: payload.mentor_id.toString(),
    receiverId: payload.mentee_id.toString(),
    title: `"${payload.title}" has been assigned to you`,
    message: `You have a new task: "${payload.title}"`,
  });
  }catch(error){
    logger.error('Failed to send notification from task:', error);
  }

  return addTask;
};

const getAllTaskFromDB = async (user: JwtPayload, paginationOptions:IPaginationOptions) => {
const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(paginationOptions);
  const result = await Task.find({ $or: [{ mentee_id: user.id }, { mentor_id: user.id }] }).populate({
    path: 'mentee_id',
    model: 'User',
    select: 'name email',
  }).populate({
    path: 'mentor_id',
    model: 'User',
    select: 'name email',
  }).sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(limit);


  const total = await Task.countDocuments({ mentor_id: user.id });
  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    },
    data: result
  };
};

const getTaskByMenteeOrMentor = async (
  user: JwtPayload
): Promise<ITask[]> => {
  const result = await Task.find({
    $or: [{ mentee_id: user.id }, { mentor_id: user.id }],
  }).populate({
    path: 'mentee_id',
    model: 'User',
    select: 'name email',
  }).populate({
    path: 'mentor_id',
    model: 'User',
    select: 'name email',
  });
 
  return result;
};

const getSingleTask = async (taskId: string, user: JwtPayload): Promise<ITask> => {
  const result = await Task.findById(taskId).populate({
    path: 'mentee_id',
    model: 'User',
    select: 'name email',
  }).populate({
    path: 'mentor_id',
    model: 'User',
    select: 'name email',
  });

  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Requested task not found!');
  }

  // if(result.mentor_id.toString() !== user.id && result.mentee_id.toString() !== user.id) {
  //   throw new ApiError(StatusCodes.FORBIDDEN, 'You are not authorized to view this task.');
  // }
  return result;
};

const deleteTask = async (taskId: string, user: JwtPayload): Promise<ITask> => {
  const result = await Task.findOneAndDelete({ _id: new Types.ObjectId(taskId), mentor_id: user.id });

  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'You are not authorized to delete this task.');
  }
  return result;
};

export const TaskService = {
  addTaskToDB,
  getAllTaskFromDB,
  getTaskByMenteeOrMentor,
  deleteTask,
  getSingleTask
};
