import { StatusCodes } from "http-status-codes";
import sendResponse from "../../../shared/sendResponse";
import { OthersServices } from "./others.service";
import catchAsync from "../../../shared/catchAsync";
import { NextFunction, Request, Response } from "express";

const createOrUpdate = catchAsync(async (req: Request, res: Response, next: NextFunction)=>{
  const payload = req.body;
  const result = await OthersServices.createOrUpdate(payload);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: `${payload.type} created or updated successfully`,
    data: result,
  });
})

const getAllOthers = catchAsync(async (req: Request, res: Response, next: NextFunction)=>{
    const {type} = req.params;
  const result = await OthersServices.getAllOthers(type as string);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Others fetched successfully',
    data: result,
  });
})
export const OthersController = { createOrUpdate, getAllOthers };