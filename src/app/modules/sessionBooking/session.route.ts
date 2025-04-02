import express from 'express';
import { SessionController } from './session.controller';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import validateRequest from '../../middlewares/validateRequest';
import { SessionValidation } from './session.validation';
const router = express.Router();


router.get('/all-bookings',auth(USER_ROLES.MENTEE, USER_ROLES.MENTOR), SessionController.getSessionBookingsByUser);
router.post('/:mentorId',auth(USER_ROLES.MENTEE), validateRequest(SessionValidation.createSessionZodSchema), SessionController.createSessionRequest);
router.get('/:sessionId',auth(USER_ROLES.MENTEE, USER_ROLES.MENTOR), SessionController.getSession);
router.patch('/:sessionId',auth(USER_ROLES.MENTEE, USER_ROLES.MENTOR), validateRequest(SessionValidation.updateSessionZodSchema), SessionController.updateSession);
export const SessionRoutes = router;