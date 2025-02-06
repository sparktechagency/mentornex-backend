import express from 'express';
import { MessageController } from './message.controller';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import fileUploadHandler from '../../middlewares/fileUploadHandler';

const router = express.Router();

router
  .route('/send/:receiver_id')
  .post(
    auth(
      USER_ROLES.MENTOR,
      USER_ROLES.MENTEE,
      USER_ROLES.ADMIN,
      USER_ROLES.SUPER_ADMIN
    ),
    fileUploadHandler(),
    MessageController.sendMessage
  );

router
  .route('/requests')
  .get(
    auth(
      USER_ROLES.MENTOR,
      USER_ROLES.MENTEE,
      USER_ROLES.ADMIN,
      USER_ROLES.SUPER_ADMIN
    ),
    MessageController.getMessageRequests
  );
router
  .route('/requests/:sender_id')
  .get(
    auth(
      USER_ROLES.MENTOR,
      USER_ROLES.MENTEE,
      USER_ROLES.ADMIN,
      USER_ROLES.SUPER_ADMIN
    ),
    MessageController.getSenderMessages
  );

router
  .route('/conversations')
  .get(
    auth(
      USER_ROLES.MENTOR,
      USER_ROLES.MENTEE,
      USER_ROLES.ADMIN,
      USER_ROLES.SUPER_ADMIN
    ),
    MessageController.getRegularConversations
  );

router
  .route('/conversations/:receiver_id')
  .get(
    auth(
      USER_ROLES.MENTOR,
      USER_ROLES.MENTEE,
      USER_ROLES.ADMIN,
      USER_ROLES.SUPER_ADMIN
    ),
    MessageController.getOneRegularMessage
  );

export const MessageRoutes = router;
