import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import { MenteeDashboardController } from './menteeDashboard.controller';

const router = express.Router();

router
  .route('/total-count')
  .get(auth(USER_ROLES.MENTEE), MenteeDashboardController.totalCount);

router.get(
  '/premium-content/:mentorId',
  auth(USER_ROLES.MENTEE),
  MenteeDashboardController.getPremiumContent
);
export const MenteeDashboardRoutes = router;
