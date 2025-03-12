import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { OthersValidations } from './others.validation';
import { OthersController } from './others.controller';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
const router = express.Router();

router.patch('/',auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), validateRequest(OthersValidations.createOrUpdateOtherZodSchema), OthersController.createOrUpdate);
router.get('/:type', OthersController.getAllOthers);
export const OthersRoutes = router;