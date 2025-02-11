import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import { ScheduleController } from './schedule.controller';

const router = express.Router();

router.route('/create-schedule')
  .post(
    auth(USER_ROLES.MENTOR),
    ScheduleController.createSchedule
  );

router.route('/get-schedule')
  .get(
    auth(USER_ROLES.MENTOR),
    ScheduleController.getSchedule
  );

router.route('/update-schedule')
  .patch(
    auth(USER_ROLES.MENTOR),
    ScheduleController.updateSchedule
  );

export const ScheduleRoutes = router;