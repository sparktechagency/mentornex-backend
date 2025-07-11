import express from 'express';
import { AuthRoutes } from '../app/modules/auth/auth.route';
import { UserRoutes } from '../app/modules/user/user.route';

import { MenteeFavoriteRoutes } from '../app/modules/menteeFavorites/favorite.route';
import { MenteeReviewRoutes } from '../app/modules/menteeReviews/review.route';
import { MenteeDashboardRoutes } from '../app/modules/menteeDashboard/menteeDashboard.route';
import { TaskRoutes } from '../app/modules/mentorTask/task.route';
import { NoteRoutes } from '../app/modules/mentorNotes/note.route';
import { AdminRoutes } from '../app/modules/admin/admin.route';

import { FaqRoutes } from '../app/modules/faq/faq.route';
import { RuleRoutes } from '../app/modules/rule/rule.route';
import { MessageRoutes } from '../app/modules/message/message.route';
import { PlatformReviewRoutes } from '../app/modules/platformReview/platformReview.route';
import { ScheduleRoutes } from '../app/modules/mentorSchedule/schedule.route';
import { ContactRoutes } from '../app/modules/contact-us/contact.route';
import { SubmitRoutes } from '../app/modules/submit-task/submit.route';
import { MentorRoutes } from '../app/modules/all-mentors/mentor.route';
import { IndustryRoutes } from '../app/modules/industry/industry.route';
import { ContentRoutes } from '../app/modules/content/content.route';
import { OthersRoutes } from '../app/modules/others/others.router';
import { PlansRoutes } from '../app/modules/plans/plans.route';
import { ChatRoutes } from '../app/modules/chat/chat.route';
import { PurchaseRoutes } from '../app/modules/purchase/purchase.route';
import { SessionRoutes } from '../app/modules/sessionBooking/session.route';
import { TodoRoutes } from '../app/modules/todo/todo.route';
import { CommunityRoutes } from '../app/modules/community/community.route';
import { PaymentRoutes } from '../app/modules/payment-record/payment.route';
import { NotificationRoutes } from '../app/modules/notification/notification.route';
import { MentorDashboardRoutes } from '../app/modules/mentorDashboard/mentorDashboard.route.';

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
  // {
  //   path: '/session',
  //   route: SessionRoutes,
  // },
  {
    path: '/community',
    route: CommunityRoutes,
  },
  {
    path: '/chat',
    route: ChatRoutes,
  },
  {
    path: '/message',
    route: MessageRoutes,
  },
  {
    path: '/notification',
    route: NotificationRoutes,
  },
  {
    path: '/mentee',
    route: MenteeFavoriteRoutes,
  },
  {
    path: '/review',
    route: MenteeReviewRoutes,
  },
  {
    path: '/mentee',
    route: MenteeDashboardRoutes,
  },
  {
    path: '/mentor-dashboard',
    route: MentorDashboardRoutes,
  },
  {
    path: '/mentor',
    route: MentorRoutes,
  },
  {
    path: '/task',
    route: TaskRoutes,
  },
  {
    path: '/plans',
    route: PlansRoutes,
  },
  {
    path: '/note',
    route: NoteRoutes,
  },

  {
    path: '/platform',
    route: PlatformReviewRoutes,
  },
  {
    path: '/purchase',
    route: PurchaseRoutes,
  },
  {
    path: '/session',
    route: SessionRoutes,
  },
  {
    path: '/payment',
    route: PaymentRoutes,
  },
  {
    path: '/schedule',
    route: ScheduleRoutes,
  },
  {
    path: '/task',
    route: SubmitRoutes,
  },
  {
    path: '/faq',
    route: FaqRoutes,
  },
  {
    path: '/todo',
    route: TodoRoutes,
  },
  {
    path: '/list',
    route: MentorRoutes,
  },
  { path: '/message', route: MessageRoutes },
  { path: '/faq', route: FaqRoutes },
  { path: '/rule', route: RuleRoutes },
  { path: '/contact', route: ContactRoutes },
  { path: '/industry', route: IndustryRoutes },
  { path: '/content', route: ContentRoutes },
  { path: '/others', route: OthersRoutes },
];

apiRoutes.forEach(route => router.use(route.path, route.route));

export default router;
