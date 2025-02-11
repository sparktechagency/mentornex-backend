import { Request, Response } from 'express';
import { contactService } from './contact.service';
import { IContact } from './contact.interface';

const createContact = async (req: Request, res: Response) => {
  try {
    const contactData: IContact = req.body;
    const result = await contactService.createContact(contactData);
    res.status(200).json({
      success: true,
      message: 'Contact form submitted successfully',
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error submitting contact form',
      error: error,
    });
  }
};

export const contactController = {
  createContact,
};