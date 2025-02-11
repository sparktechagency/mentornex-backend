import { emailHelper } from '../../../helpers/emailHelper';
import { contactEmailTemplate } from './contact.emailTemplate';
import { IContact, IContactResponse } from './contact.interface';
import { Contact } from './contact.model';

const createContact = async (payload: IContact): Promise<IContactResponse> => {
  try {
    // Save contact message to database
    const contact = await Contact.create(payload);

    // Send confirmation email to user
    await emailHelper.sendEmail(
      contactEmailTemplate.userConfirmation({
        name: payload.name,
        email: payload.email,
      })
    );

    // Send notification email to admin
    await emailHelper.sendEmail(
      contactEmailTemplate.adminNotification({
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        country: payload.country,
        message: payload.message,
      })
    );

    return {
      success: true,
      message: 'Contact message sent successfully',
    };
  } catch (error) {
    throw error;
  }
};

export const contactService = {
  createContact,
};