import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { NotificationController } from './notification.controller';
const router = express.Router();

router.get(
  '/',
  auth(USER_ROLES.MENTEE, USER_ROLES.MENTOR, USER_ROLES.SUPER_ADMIN),
  NotificationController.getNotifications
);

router.patch(
  '/',
  auth(USER_ROLES.MENTEE, USER_ROLES.MENTOR, USER_ROLES.SUPER_ADMIN),
  NotificationController.updateNotification
);

export const NotificationRoutes = router;
