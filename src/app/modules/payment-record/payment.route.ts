import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { PaymentController } from './payment.controller';
const router = express.Router();

router.get(
  '/transactions',
  //   auth(USER_ROLES.SUPER_ADMIN),
  PaymentController.getAllTransactions
);

export const PaymentRoutes = router;
