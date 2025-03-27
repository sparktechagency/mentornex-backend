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

router.route('/')
  .get(
    auth(USER_ROLES.MENTOR,USER_ROLES.MENTEE),
    ScheduleController.getMentorSchedule
  );


export const ScheduleRoutes = router;