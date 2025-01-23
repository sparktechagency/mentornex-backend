import express from 'express';
import { AuthRoutes } from '../app/modules/auth/auth.route';
import { UserRoutes } from '../app/modules/user/user.route';
import { SessionRoutes } from '../app/modules/sessionBooking/session.route';
import { MenteeFavoriteRoutes } from '../app/modules/MenteeFavorite/favorite.route';
import { MenteeReviewRoutes } from '../app/modules/MenteeReview/review.route';
const router = express.Router();

const apiRoutes = [
  {
    path: '/user',
    route: UserRoutes,
  },
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/session',
    route: SessionRoutes,
  },
  {
    path: '/mentee',
    route: MenteeFavoriteRoutes,
  },
  {
    path: '/mentee',
    route: MenteeReviewRoutes,
  }
];

apiRoutes.forEach(route => router.use(route.path, route.route));

export default router;
