import express from 'express';
import { ContentController } from './content.controller';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import validateRequest from '../../middlewares/validateRequest';
import { ContentValidations } from './content.validation';

const router = express.Router();

router.post('/',auth(USER_ROLES.MENTOR), validateRequest(ContentValidations.addContentZodSchema), ContentController.addContent);

router.patch('/:id', auth(USER_ROLES.MENTOR), validateRequest(ContentValidations.updateContentZodSchema), ContentController.updateContent);

router.delete('/:id', auth(USER_ROLES.MENTOR), ContentController.deleteContent);

router.get('/', auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.MENTEE, USER_ROLES.MENTOR), ContentController.getAllContent);

export const ContentRoutes = router;
