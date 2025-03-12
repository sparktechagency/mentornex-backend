import { StatusCodes } from "http-status-codes";
import { Others } from "./others.model";
import { IOthers } from "./others.interface";
import ApiError from "../../../errors/ApiError";

const createOrUpdate = async (payload: IOthers): Promise<IOthers> => {
  const others = await Others.findOneAndUpdate({ type: payload.type }, payload, { new: true, upsert: true });
  if (!others) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to created Others');
  }

  return others;
};

const getAllOthers = async (type:string): Promise<IOthers> => {
  const others = await Others.findOne({type});
  if(!others) throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to get Others');
  return others;
};
export const OthersServices = { createOrUpdate, getAllOthers };