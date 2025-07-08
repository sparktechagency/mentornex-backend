import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { Submit } from './submit.model';
import { ISubmit } from './submit.interface';
import { JwtPayload } from 'jsonwebtoken';
import { Types } from 'mongoose';
import { Task } from '../mentorTask/task.model';

const createOrUpdateSubmit = async (user:JwtPayload, payload: ISubmit) => {

  const [isTaskExist, isSubmitExist] = await Promise.all([
    Task.findById(payload.taskId),
    Submit.findOne({ taskId: new Types.ObjectId(payload.taskId) })
  ]);

  if (!isTaskExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Requested task not found');
  }

  // if(isTaskExist.mentee_id.toString() !== user.id) {
  //   throw new ApiError(StatusCodes.FORBIDDEN, 'You are not authorized to submit this task.');
  // }

  

  if (isSubmitExist) {
    const result = await Submit.findOneAndUpdate({ taskId: new Types.ObjectId(payload.taskId) }, payload, { new: true });
    if (!result) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Filed to submit task.');
    }
    isTaskExist.status = 'complete';
    await isTaskExist.save();
    return result;
  }

  const result = await Submit.create(payload);
  if (!result) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Filed to submit task.');
  }
  isTaskExist.status = 'complete';
  await isTaskExist.save();
  return result;
};



const getSubmissionByTask = async(user:JwtPayload, taskId: Types.ObjectId) => {
  const result = await Submit.findOne({ taskId: new Types.ObjectId(taskId) })
    .populate<{taskId: {mentor_id: Types.ObjectId, mentee_id: Types.ObjectId, answer: string, file: string, status: string, feedback: string}}>({
      path: 'taskId',
      select: {mentor_id: 1, mentee_id: 1, answer: 1, file: 1, status: 1}
    });

  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Requested task not found!');
  }

  console.log(result);

  if(result.menteeId.toString() !== user.id && result.taskId.mentor_id.toString() !== user.id) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'You are not authorized to view this task.');
  }
  return result;
}

const createFeedbackToDB = async (payload: Partial<ISubmit>) => {
  const result = await Submit.findOneAndUpdate(
    { taskId: new Types.ObjectId(payload.taskId) },
    { $set: { feedback: payload.feedback, status: 'reviewed' } },
    { new: true }
  );
  if (!result) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to submit task');
  }
  return result;
};

export const SubmitService = {
  createOrUpdateSubmit,

  createFeedbackToDB,
  getSubmissionByTask,
  
};
