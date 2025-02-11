import express from 'express';
import { AuthRoutes } from '../app/modules/auth/auth.route';
import { UserRoutes } from '../app/modules/user/user.route';
import { SessionRoutes } from '../app/modules/sessionBooking/session.route';
import { MenteeFavoriteRoutes } from '../app/modules/menteeFavorites/favorite.route';
import { MenteeReviewRoutes } from '../app/modules/menteeReviews/review.route';
import { MenteeDashboardRoutes } from '../app/modules/menteeDashboard/menteeDashboard.route';
import { TaskRoutes } from '../app/modules/mentorTask/task.route';
import { NoteRoutes } from '../app/modules/mentorNotes/note.route';
import { AdminRoutes } from '../app/modules/admin/admin.route';
import { SubscriptionRoutes } from '../app/modules/subscription/subscription.route';
import { PricingPlanRoutes } from '../app/modules/mentorPricingPlan/pricing-plan.route';
import { FaqRoutes } from '../app/modules/faq/faq.route';
import { RuleRoutes } from '../app/modules/rule/rule.route';
import { ContactRoutes } from '../app/modules/contact/contact.routes';
import { MessageRoutes } from '../app/modules/message/message.route';
import { PlatformReviewRoutes } from '../app/modules/platformReviewByMentee/platformReview.route';
import { ScheduleRoutes } from '../app/modules/mentorSchedule/schedule.route';
const router = express.Router();

router.use('/payment/webhook', express.raw({ type: 'application/json' }));

const apiRoutes = [
  {
    path: '/super-admin',
    route: AdminRoutes,
  },
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
  },
  {
    path: '/subscription',
    route: SubscriptionRoutes,
  },
  {
    path: '/note',
    route: NoteRoutes,
  },
  {
    path: '/mentor',
    route: PricingPlanRoutes,
  },
  {
    path: '/platform',
    route: PlatformReviewRoutes,
  },
  {
    path: '/schedule',
    route: ScheduleRoutes,
  },
  { path: "/message", route: MessageRoutes },
  { path: '/faq', route: FaqRoutes },
  { path: '/rule', route: RuleRoutes },
  { path: "/contact", route: ContactRoutes }

];

apiRoutes.forEach(route => router.use(route.path, route.route));

export default router;
