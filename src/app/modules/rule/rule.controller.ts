import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { RuleService } from './rule.service';


//privacy policy
const createPrivacyPolicy = catchAsync(async (req: Request, res: Response) => {
    const { ...privacyData } = req.body
    const result = await RuleService.createPrivacyPolicyToDB(privacyData)
  
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: result.message,
        data: result.result
    })
})

const getPrivacyPolicy = catchAsync(async (req: Request, res: Response) => {
    const result = await RuleService.getPrivacyPolicyFromDB()
  
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Privacy policy retrieved successfully',
        data: result
    })
})


//terms and conditions
const createTermsAndCondition = catchAsync( async (req: Request, res: Response) => {
    const { ...termsData } = req.body
    const result = await RuleService.createTermsAndConditionToDB(termsData)
  
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: result.message,
        data: result.result
    })
})
  
const getTermsAndCondition = catchAsync(async (req: Request, res: Response) => {
    const result = await RuleService.getTermsAndConditionFromDB()
  
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Terms and conditions retrieved successfully',
        data: result
    })
})

export const RuleController = {
    createPrivacyPolicy,
    getPrivacyPolicy,
    createTermsAndCondition,
    getTermsAndCondition
}  