import { Request, Response } from 'express';
import { contactService } from './contact.service';
import { IContact } from './contact.interface';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';

const createContact = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await contactService.createContact(payload);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Contact form submitted successfully',
    data: result,
  });
});

export const contactController = {
  createContact,
};