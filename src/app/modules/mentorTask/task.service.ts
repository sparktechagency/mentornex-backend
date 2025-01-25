import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiError";
import { ITask } from "./task.interface";
import { Task } from "./task.model";


const addTaskToDB = async (payload: ITask): Promise<ITask> => {
    const addTask = await Task.create(payload);
    if (!addTask) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to add Task');
    }
    return addTask;
};

export const TaskService = {
    addTaskToDB
};