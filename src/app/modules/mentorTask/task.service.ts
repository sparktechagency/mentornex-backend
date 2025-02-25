import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { ITask } from './task.interface';
import { Task } from './task.model';
import { User } from '../user/user.model';
import unlinkFile from '../../../shared/unlinkFile';

const addTaskToDB = async (payload: ITask): Promise<ITask> => {
  const addTask = await Task.create(payload);
  const isMentorExist = await User.isExistUserById(payload.mentor_id);
  if (!isMentorExist) {
    if (payload.file) {
      unlinkFile(payload.file);
    }
    throw new ApiError(StatusCodes.NOT_FOUND, 'Mentor not found');
  }
  if (!addTask) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to add Task');
  }
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

const getTaskByMenteeFromDB = async (
  mentorId: string,
  menteeId: string
): Promise<ITask[]> => {
  const result = await Task.find({
    mentor_id: mentorId,
    mentee_id: menteeId,
  }).populate({
    path: 'mentor_id',
    model: 'User',
    select: 'name email',
  });
  if (!result || result.length === 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'No tasks found!');
  }
  return result;
};

export const TaskService = {
  addTaskToDB,
  getAllTaskFromDB,
  getTaskByMenteeFromDB,
};
