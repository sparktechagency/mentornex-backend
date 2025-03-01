import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { Submit } from './submit.model';
import { ISubmit } from './submit.interface';
import { User } from '../user/user.model';
import unlinkFile from '../../../shared/unlinkFile';

const createSubmitToDB = async (payload: ISubmit) => {
  const result = await Submit.create(payload);
  const isMenteeExist = await User.isExistUserById(payload.menteeId);
  if (!isMenteeExist) {
    if (payload.file) {
      unlinkFile(payload.file);
    }
    throw new ApiError(StatusCodes.NOT_FOUND, 'Mentee not found');
  }
  if (!result) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to submit task');
  }
  return result;
};

const getSubmitByMenteeFromDB = async (menteeId: string, taskId: string) => {
  const result = await Submit.find({ menteeId, taskId });
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'No task found');
  }
  return result;
};

const getSubmitByMentorFromDB = async (taskId: string) => {
  const result = await Submit.find({ taskId })
    .populate({
      path: 'menteeId',
      model: 'User',
      select: 'name image',
    })
    .populate('taskId', 'answer file status');
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'No task found');
  }
  return result;
};

const createFeedbackToDB = async (payload: Partial<ISubmit>) => {
  const result = await Submit.findOneAndUpdate(
    { taskId: payload.taskId },
    { $set: { feedback: payload.feedback, status: 'reviewed' } },
    { new: true }
  );
  if (!result) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to submit task');
  }
  return result;
};

export const SubmitService = {
  createSubmitToDB,
  getSubmitByMenteeFromDB,
  getSubmitByMentorFromDB,
  createFeedbackToDB,
};
