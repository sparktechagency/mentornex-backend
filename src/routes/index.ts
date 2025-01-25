import express from 'express';
import { AuthRoutes } from '../app/modules/auth/auth.route';
import { UserRoutes } from '../app/modules/user/user.route';
import { SessionRoutes } from '../app/modules/sessionBooking/session.route';
import { MenteeFavoriteRoutes } from '../app/modules/menteeFavorites/favorite.route';
import { MenteeReviewRoutes } from '../app/modules/menteeReviews/review.route';
import { MenteeDashboardRoutes } from '../app/modules/menteeDashboard/menteeDashboard.route';
import { TaskRoutes } from '../app/modules/mentorTask/task.route';
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
  },
  {
    path: '/mentee',
    route: MenteeDashboardRoutes,
  },
  {
    path: '/task',
    route: TaskRoutes,
  }
];

apiRoutes.forEach(route => router.use(route.path, route.route));

export default router;
