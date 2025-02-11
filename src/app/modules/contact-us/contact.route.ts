import express from 'express';
import { contactController } from './contact.controller';

const router = express.Router();

router.route('/contact-us').post(contactController.createContact);

export const ContactRoutes = router;