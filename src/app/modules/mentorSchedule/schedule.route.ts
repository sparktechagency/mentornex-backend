import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import { ScheduleController } from './schedule.controller';

const router = express.Router();

router
  .route('/create-schedule')
  .post(auth(USER_ROLES.MENTOR), ScheduleController.createSchedule);

router
  .route('/')
  .get(
    auth(USER_ROLES.MENTOR, USER_ROLES.MENTEE),
    ScheduleController.getMentorSchedule
  );

router
  .route('/available-slots/:mentorId')
  .get(
    auth(USER_ROLES.MENTEE, USER_ROLES.MENTOR),
    ScheduleController.getAvailableSlots
  );

export const ScheduleRoutes = router;
