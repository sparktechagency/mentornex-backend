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

  const notificationMessage = `New task "${payload.title}" has been assigned to you`;
  const notification = await Notification.create({
    senderId: payload.mentor_id,
    receiverId: payload.mentee_id,
    message: notificationMessage,
    read: false,
    createdAt: new Date(),
  });

  // Send real-time notification via socket.io if mentee is online
  socketHelper.sendNotification(payload.mentee_id.toString(), {
    notification,
    task: addTask,
  });

  return addTask;
};

const getAllTaskFromDB = async (mentorId: string): Promise<ITask[]> => {
  const result = await Task.find({ mentor_id: mentorId }).populate({
    path: 'mentee_id',
    model: 'User',
    select: 'name email',
  });

  if (!result || result.length === 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'No tasks found!');
  }

  return result;
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
};
