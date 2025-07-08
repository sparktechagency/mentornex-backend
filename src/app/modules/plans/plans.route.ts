import express from 'express';
import { PlansController } from './plans.controller';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import validateRequest from '../../middlewares/validateRequest';
import { PlansValidations } from './plans.validation';
import { handleStripeCheck } from '../../middlewares/stripeCheck';

const router = express.Router();

router.post(
  '/pay-per-session',
  auth(USER_ROLES.MENTOR),
  handleStripeCheck,
  validateRequest(PlansValidations.createPayPerSessionSchema),
  PlansController.createPayPerSession
);
router.patch(
  '/pay-per-session/:id',
  auth(USER_ROLES.MENTOR),
  handleStripeCheck,
  validateRequest(PlansValidations.updatePayPerSessionSchema),
  PlansController.updatePayPerSession
);
router.delete(
  '/pay-per-session/:id',
  auth(USER_ROLES.MENTOR),
  handleStripeCheck,
  PlansController.deletePayPerSession
);

router.post(
  '/package',
  auth(USER_ROLES.MENTOR),
  handleStripeCheck,
  validateRequest(PlansValidations.createPackageSchema),
  PlansController.createPackage
);
router.patch(
  '/package/:id',
  auth(USER_ROLES.MENTOR),
  handleStripeCheck,
  validateRequest(PlansValidations.updatePackageSchema),
  PlansController.updatePackage
);
router.delete(
  '/package/:id',
  auth(USER_ROLES.MENTOR),
  handleStripeCheck,
  PlansController.deletePackage
);

router.post(
  '/subscription-plan',
  auth(USER_ROLES.MENTOR),
  handleStripeCheck,
  validateRequest(PlansValidations.createSubscriptionSchema),
  PlansController.createSubscriptionPlan
);
router.patch(
  '/subscription-plan/:id',
  auth(USER_ROLES.MENTOR),
  handleStripeCheck,
  validateRequest(PlansValidations.updateSubscriptionSchema),
  PlansController.updateSubscriptionPlan
);
router.delete(
  '/subscription-plan/:id',
  auth(USER_ROLES.MENTOR),
  handleStripeCheck,
  PlansController.deleteSubscriptionPlan
);

router.get('/pricing-plans/:id', PlansController.getPricingPlans);

export const PlansRoutes = router;
