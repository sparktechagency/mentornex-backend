import { Request, Response, NextFunction } from 'express';
import { IndustryServices } from './industry.service';
import catchAsync from '../../../shared/catchAsync';
import { getSingleFilePath } from '../../../shared/getFilePath';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';

const createIndustry = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { ...industryData } = req.body;
    const image = getSingleFilePath(req.files, 'image');
    industryData.image = image;
    console.log(image)
    const result = await IndustryServices.createIndustry(industryData);
   
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Industry created successfully',
      data: result,
    });
  }
);


const updateIndustry = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { ...industryData } = req.body;

    const image = getSingleFilePath(req.files, 'image');
    industryData.image = image;

    const result = await IndustryServices.updateIndustry(req.params.id,industryData);
   sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,   
      message: 'Industry updated successfully',
      data: result,
    });
  }
);

const deleteIndustry = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const result = await IndustryServices.deleteIndustry(id);
   
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,   
      message: 'Industry deleted successfully',
      data: result,
    });
  }
);

const getAllIndustries = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await IndustryServices.getAllIndustries();
    
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,   
      message: 'Industries fetched successfully',
      data: result,
    });
  }
);

const getSingleIndustry = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const result = await IndustryServices.getSingleIndustry(id);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,   
      message: 'Industry fetched successfully',
      data: result,
    });
  }
);

export const IndustryController = { createIndustry, updateIndustry, deleteIndustry, getAllIndustries, getSingleIndustry };
