import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { SubscriptionController } from './subscription.controller.';

const router = express.Router();

router.route('/create/:mentor_id').post(
  auth(USER_ROLES.MENTEE),
  SubscriptionController.createSubscription
);

export const SubscriptionRoutes = router;