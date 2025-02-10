import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import { MenteeDashboardController } from './menteeDashboard.controller';

const router = express.Router();

router.route('/total-count').get(
  auth(USER_ROLES.MENTEE),
  MenteeDashboardController.totalCount
);

export const MenteeDashboardRoutes = router;