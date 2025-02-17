import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import { MentorDashboardController } from './mentorDashboard.controller';

const router = express.Router();

router.route('/total-count').get(
  auth(USER_ROLES.MENTOR),
  MentorDashboardController.totalCount
);

router.route('/mentor/balance').get(
    auth(USER_ROLES.MENTOR),
    MentorDashboardController.getMentorBalance
  );

export const MentorDashboardRoutes = router;