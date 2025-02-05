import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { ContactService } from "./contact.service";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";

const createContact = catchAsync(async(req: Request, res: Response)=>{
    const result = await ContactService.createContactToDB(req.body);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Contact created Successfully",
        data: result
    })
})

const getContact = catchAsync(async(req: Request, res: Response)=>{
    const result = await ContactService.getContactFromDB(req.query);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Contact Retrieved Successfully",
        data: result
    })
})

const deleteContact = catchAsync(async(req: Request, res: Response)=>{
    const result = await ContactService.deleteContactToDB(req.params.id);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Contact Deleted Successfully",
        data: result
    })
})

const bulkContactDelete = catchAsync(async(req: Request, res: Response)=>{
    const result = await ContactService.bulkContactDeleteToDB(req.body);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Bulk Contact Deleted Successfully",
        data: result
    })
})

export const ContactController = {
    createContact,
    getContact,
    deleteContact,
    bulkContactDelete
}