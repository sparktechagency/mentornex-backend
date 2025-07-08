import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import fileUploadHandler from '../../middlewares/fileUploadHandler';
import { SubmitController } from './submit.controller';

const router = express.Router();

router
  .route('/submit-task/:taskId')
  .post(
    auth(USER_ROLES.MENTEE),
    fileUploadHandler(),
    SubmitController.createOrUpdateSubmit
  );

router.get('/submit/:taskId',auth(USER_ROLES.MENTEE, USER_ROLES.MENTOR), SubmitController.getSubmissionByTask);

router.route('/feedback/:taskId').patch(
  auth(USER_ROLES.MENTOR),
  SubmitController.createFeedback
);

export const SubmitRoutes = router;