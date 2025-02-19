import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { SubscriptionController } from './subscription.controller.';

const router = express.Router();

router.post(
  '/create-checkout-session/:mentor_id',
  auth(USER_ROLES.MENTEE),
  SubscriptionController.createCheckoutSessions
);

export const SubscriptionRoutes = router;