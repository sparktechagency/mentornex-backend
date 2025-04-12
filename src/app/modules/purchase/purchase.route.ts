import express from 'express';
import { PurchaseController } from './purchase.controller';
import { PurchaseValidations } from './purchase.validation';
import validateRequest from '../../middlewares/validateRequest';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';

const router = express.Router();
router.post(
  '/pay-per-session/:id',
  auth(USER_ROLES.MENTEE),
  PurchaseController.purchasePayPerSession
);
router.post(
  '/package/:id',
  auth(USER_ROLES.MENTEE),
  PurchaseController.purchasePackage
);
router.post(
  '/subscription/:id',
  auth(USER_ROLES.MENTEE),
  PurchaseController.purchaseSubscription
);
router.post(
  '/cancel-subscription/:id',
  auth(USER_ROLES.MENTEE),
  PurchaseController.cancelSubscription
);

//geta available plans for mentee and remaining quota for a specific mentor
router.get(
  '/mentee-available-plans-and-remaining-quota/:id',
  auth(USER_ROLES.MENTEE),
  PurchaseController.getMenteeAvailablePlansAndRemainingQuota
);

//purchased active plans for mentee
router.get(
  '/all-package-and-subscription/',
  auth(USER_ROLES.MENTEE),
  PurchaseController.getAllPackageAndSubscription
);
export const PurchaseRoutes = router;
