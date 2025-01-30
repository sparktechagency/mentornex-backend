import express from 'express';
import { PricingPlanController } from './pricing-plan.controller';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';

const router = express.Router();

router.post(
  '/subscription',
  auth(USER_ROLES.MENTOR),
  //validateRequest(PricingPlanValidation.createSubscriptionPlanZodSchema),
  PricingPlanController.createSubscriptionPlan
);

router.post(
  '/pay-per-session',
  auth(USER_ROLES.MENTOR),
  //validateRequest(PricingPlanValidation.createPayPerSessionPlanZodSchema),
  PricingPlanController.createPayPerSessionPlan
);

router.get(
  '/:mentorId',
  PricingPlanController.getMentorPricingPlan
);

export const PricingPlanRoutes = router;