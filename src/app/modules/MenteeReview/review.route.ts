import express, { NextFunction, Request, Response } from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { ReviewController } from './review.controller';

const router = express.Router();

router.route('/review/add').post(
  auth(USER_ROLES.MENTEE),
  ReviewController.addReviewMentor
);

export const MenteeReviewRoutes = router;