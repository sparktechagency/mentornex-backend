import express from 'express';
import { PricingPlanController } from './pricing-plan.controller';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';

const router = express.Router();

router.post(
  '/setup-stripe',
  auth(USER_ROLES.MENTOR),
  PricingPlanController.setupStripeAccount
);

router.post(
  '/subscription',
  auth(USER_ROLES.MENTOR),
  PricingPlanController.createSubscriptionPlan
);
router.post(
  '/pay-per-session',
  auth(USER_ROLES.MENTOR),
  PricingPlanController.createPayPerSessionPlan
);
router.get(
  '/:mentorId',
  PricingPlanController.getMentorPricingPlan
);

export const PricingPlanRoutes = router;