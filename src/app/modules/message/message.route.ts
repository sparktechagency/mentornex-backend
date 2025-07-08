import express, { NextFunction, Request, Response } from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { MessageController } from './message.controller';
import { MessageValidation } from './message.validation';
import fileUploadHandler from '../../middlewares/fileUploadHandler';

const router = express.Router();

router.get('/:chatId', auth(USER_ROLES.MENTEE, USER_ROLES.MENTOR), MessageController.getMessages);

router.post('/:chatId',auth(USER_ROLES.MENTEE, USER_ROLES.MENTOR),fileUploadHandler(), (req:Request, res:Response, next:NextFunction) => {
  if(req.body.data){
    req.body = MessageValidation.createMessageZodSchema.parse(JSON.parse(req.body.data));
  }
  return MessageController.sendMessage(req, res, next);
});

export const MessageRoutes = router;