import express, { NextFunction, Request, Response } from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { TaskValidation } from './task.validation.';
import { TaskController } from './task.controller';
const router = express.Router();

router
  .route('/add-task')
  .post(
    auth(USER_ROLES.MENTOR),
    validateRequest(TaskValidation.taskZodSchema),
    TaskController.addTask
  );
router.route('/get-all-task').get(auth(USER_ROLES.MENTOR), TaskController.getAllTask);
export const TaskRoutes = router;