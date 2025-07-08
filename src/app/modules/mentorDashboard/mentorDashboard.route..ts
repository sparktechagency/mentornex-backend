import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import { MentorDashboardController } from './mentorDashboard.controller';
import { DashboardController } from './dashboard.controller';

const router = express.Router();

// router
//   .route('/total-count')
//   .get(auth(USER_ROLES.MENTOR), MentorDashboardController.totalCount);

// router
//   .route('/mentor/balance')
//   .get(auth(USER_ROLES.MENTOR), MentorDashboardController.getMentorBalance);

// router
//   .route('/completed-pay-per-sessions')
//   .get(
//     auth(USER_ROLES.MENTOR),
//     MentorDashboardController.sessionCompletedAsPayPerSession
//   );

router.get(
  '/general-stats',
  auth(USER_ROLES.MENTOR),
  MentorDashboardController.getMentorGeneralStats
);
router.get(
  '/session-rate',
  auth(USER_ROLES.MENTOR),
  DashboardController.getSessionRateData
);

router.get(
  '/earnings',
  auth(USER_ROLES.MENTOR),
  DashboardController.getEarningData
);
export const MentorDashboardRoutes = router;
