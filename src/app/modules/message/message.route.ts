import express, { NextFunction, Request, Response } from 'express';
import { MessageController } from './message.controller';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import fileUploadHandler from '../../middlewares/fileUploadHandler';
import { MessageValidation } from './message.validation';

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
    (req:Request, res:Response, next:NextFunction)=>{
      if(req.body.data) {
        req.body = MessageValidation.createMessageZodSchema.parse(
          JSON.parse(req.body.data)
        );
       }
       return MessageController.sendMessage(req, res, next);
     }
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
