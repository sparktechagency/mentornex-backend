import express from 'express';
import auth from '../../middlewares/auth';
import { MentorController } from './mentor.controller';
import { USER_ROLES } from '../../../enums/user';
const router = express.Router();

router.route('/mentors-list').get(
    MentorController.getAllMentors
  );

// router.route('/all-active-mentors').get(
//     auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.MENTEE),
//     MentorController.getAllActiveMentors
//   );

router.route('/mentors/:id').get(

    MentorController.getSingleMentor
  );

router.post('/setup-stripe',
    auth(USER_ROLES.MENTOR),
    MentorController.onboardMentorToStripe
  );

  router.post('/create-stripe-login-link',
    auth(USER_ROLES.MENTOR),
    MentorController.createStripeLoginLink
  );
router.get('/mentees',
    auth(USER_ROLES.MENTOR),
    MentorController.getMenteeByMentor
  );
export  const MentorRoutes = router;