import express, { NextFunction, Request, Response } from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import { ServiceReviewController } from './serviceReview.controller';


const router = express.Router();

router.route('/review/add').post(
  auth(USER_ROLES.MENTEE),
  ServiceReviewController.addReviewMentorbyMentee
);

router.route('/reviews').get(
  auth(USER_ROLES.MENTEE),
  ServiceReviewController.getAllReviews
);

router.route('/review/delete').delete(
  auth(USER_ROLES.MENTEE),
  ServiceReviewController.deleteReviewByMentee
);

export const ServiceReviewRoutes = router;