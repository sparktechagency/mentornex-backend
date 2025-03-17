import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { TaskValidation } from './task.validation.';
import { TaskController } from './task.controller';
import fileUploadHandler from '../../middlewares/fileUploadHandler';
const router = express.Router();

router
  .route('/add-task')
  .post(
    auth(USER_ROLES.MENTOR),
    validateRequest(TaskValidation.taskZodSchema),
    fileUploadHandler(),
    TaskController.addTask
  );
router.route('/get-all-task').get(auth(USER_ROLES.MENTOR), TaskController.getAllTask);
router.route('/get-task').get(auth(USER_ROLES.MENTEE), TaskController.getTaskByMentee);
export const TaskRoutes = router;