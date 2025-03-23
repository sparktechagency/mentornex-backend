import express from 'express';
import { ChatController } from './chat.controller';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';

const router = express.Router();

router.post('/' ,auth(USER_ROLES.MENTEE, USER_ROLES.MENTOR), ChatController.createChat); 

router.get('/' ,auth(USER_ROLES.MENTEE, USER_ROLES.MENTOR), ChatController.getChatList); 

export const ChatRoutes = router;
