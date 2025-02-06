import express from 'express';
import { MessageController } from './message.controller';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';

const router = express.Router();

router.
route('/send/:receiver_id')
.post(
  auth(USER_ROLES.MENTOR, USER_ROLES.MENTEE, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  MessageController.sendMessage
  )
;

router.route(
    '/history/:receiver_id').get(
  auth(USER_ROLES.MENTOR, USER_ROLES.MENTEE, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  MessageController.getMessageHistory
);

export const MessageRoutes = router;