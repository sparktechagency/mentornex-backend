import express from 'express';
import { PlansController } from './plans.controller';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import validateRequest from '../../middlewares/validateRequest';
import { PlansValidations } from './plans.validation';

const router = express.Router();

router.post('/pay-per-session',auth(USER_ROLES.MENTOR), validateRequest(PlansValidations.createPayPerSessionSchema), PlansController.createPayPerSession);
router.put('/pay-per-session/:id',auth(USER_ROLES.MENTOR), validateRequest(PlansValidations.updatePayPerSessionSchema), PlansController.updatePayPerSession);
router.delete('/pay-per-session/:id',auth(USER_ROLES.MENTOR), PlansController.deletePayPerSession);

router.post('/package',auth(USER_ROLES.MENTOR), validateRequest(PlansValidations.createPackageSchema), PlansController.createPackage);
router.put('/package/:id',auth(USER_ROLES.MENTOR), validateRequest(PlansValidations.updatePackageSchema), PlansController.updatePackage);
router.delete('/package/:id',auth(USER_ROLES.MENTOR), PlansController.deletePackage);

router.post('/subscription-plan',auth(USER_ROLES.MENTOR), validateRequest(PlansValidations.createSubscriptionSchema), PlansController.createSubscriptionPlan);
router.put('/subscription-plan/:id',auth(USER_ROLES.MENTOR), validateRequest(PlansValidations.updateSubscriptionSchema), PlansController.updateSubscriptionPlan);
router.delete('/subscription-plan/:id',auth(USER_ROLES.MENTOR), PlansController.deleteSubscriptionPlan);

router.get('/pricing-plans', PlansController.getPricingPlans);

export const PlansRoutes = router;
