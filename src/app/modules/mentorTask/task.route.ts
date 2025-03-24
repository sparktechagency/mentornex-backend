import express, { NextFunction, Request, Response } from 'express';
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
    fileUploadHandler(),
   (req:Request, res:Response, next:NextFunction)=>{

     if(req.body.data) {
      req.body = TaskValidation.taskZodSchema.parse(
        JSON.parse(req.body.data)
      );
     }
     return TaskController.addTask(req, res, next);
   }
  );

router.get('/:id',auth(USER_ROLES.MENTOR, USER_ROLES.MENTEE), TaskController.getSingleTask);
router.route('/').get(auth(USER_ROLES.MENTOR), TaskController.getAllTask);
router.route('/').get(auth(USER_ROLES.MENTEE,USER_ROLES.MENTOR), TaskController.getTaskByMenteeOrMentor);
router.route('/delete-task/:id').delete(auth(USER_ROLES.MENTOR), TaskController.deleteTask);
export const TaskRoutes = router;