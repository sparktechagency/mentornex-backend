import express, { NextFunction, Request, Response } from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import { ReviewController } from './review.controller';


const router = express.Router();

router.route('/review/add').post(
  auth(USER_ROLES.MENTEE),
  ReviewController.addReviewMentorbyMentee
);

router.route('/reviews').get(
  auth(USER_ROLES.MENTOR),
  ReviewController.getAllReviewsByMentor
);

router.route('/review/delete').delete(
  auth(USER_ROLES.MENTEE),
  ReviewController.deleteReviewByMentee
);

export const MenteeReviewRoutes = router;