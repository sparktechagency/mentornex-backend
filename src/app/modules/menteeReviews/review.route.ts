import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import { ReviewController } from './review.controller';
import validateRequest from '../../middlewares/validateRequest';
import { ReviewValidation } from './review.validation';

const router = express.Router();

router
  .route('/review/add/:mentor_id')
  .post(
    auth(USER_ROLES.MENTEE),
    validateRequest(ReviewValidation.addReviewSchema),
    ReviewController.addReviewMentorbyMentee
  );

router
  .route('/reviews')
  .get(
    auth(USER_ROLES.MENTOR, USER_ROLES.MENTEE),
    ReviewController.getMyReviews
  );

router.get('/:mentor_id', ReviewController.getMentorReviews);

router
  .route('/review/delete')
  .delete(
    auth(USER_ROLES.MENTEE),
    validateRequest(ReviewValidation.deleteReviewSchema),
    ReviewController.deleteReviewByMentee
  );

router
  .route('/mentors')
  .get(auth(USER_ROLES.MENTEE), ReviewController.getAllMentorForMentee);

router
  .route('/mentors/:mentor_id')
  .get(auth(USER_ROLES.MENTEE), ReviewController.getAvailableContent);

export const MenteeReviewRoutes = router;
