import express, { NextFunction, Request, Response } from 'express';
import { SessionController } from './session.controller';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { SessionValidation } from './session.validation';
const router = express.Router();

router
  .route('/mentee/book')
  .post(
    auth(USER_ROLES.MENTEE),
    validateRequest(SessionValidation.bookSessionZodSchema),
    SessionController.bookSession
  );

router.route('/mentee/upcoming-sessions').get(
  auth(USER_ROLES.MENTEE),
  SessionController.MenteeUpcomingSession
);

router.route('/mentee/completed-sessions').get(
  auth(USER_ROLES.MENTEE),
  SessionController.MenteeCompletedSession
);

router.route('/mentor/requested-sessions').get(
  auth(USER_ROLES.MENTOR),
  SessionController.MentorRequestedSession
);
router.route('/mentor/accepted-sessions').get(
  auth(USER_ROLES.MENTOR),
  SessionController.MentorAccepetedSession
);

router.route('/mentor/completed-sessions').get(
  auth(USER_ROLES.MENTOR),
  SessionController.MentorCompletedSession
);

router.route('/mentor/update-session-status').patch(
  auth(USER_ROLES.MENTOR),
  validateRequest(SessionValidation.updateSessionStatusZodSchema),
  SessionController.MentorUpdateSessionStatus
);


export const SessionRoutes = router;