import express from 'express';
import { PaymentController } from './payment.controller';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';

const router = express.Router();

router.post(
  '/create-checkout',
  auth(USER_ROLES.MENTEE),
  PaymentController.createCheckout
);

router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  PaymentController.handleWebhook
);

export const PaymentRoutes = router;