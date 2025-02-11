import express, { NextFunction, Request, Response } from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import { PlatformReviewController } from './platformReview.controller';


const router = express.Router();

router.route('/review/add').post(
  auth(USER_ROLES.MENTEE),
  PlatformReviewController.addReviewbyMentee
);

router.route('/reviews').get(
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  PlatformReviewController.getAllReviews
);

router.route('/review/delete').delete(
  auth(USER_ROLES.MENTEE),
  PlatformReviewController.deleteReviewByMentee
);

export const PlatformReviewRoutes = router;