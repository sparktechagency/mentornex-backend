import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { AuthController } from './auth.controller';
import { AuthValidation } from './auth.validation';
const router = express.Router();

router.post(
  '/login',
  validateRequest(AuthValidation.createLoginZodSchema),
  AuthController.loginUser
);
router.post('/logout', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.MENTOR, USER_ROLES.MENTEE), AuthController.logoutUser);

router.post(
  '/forget-password',
  validateRequest(AuthValidation.createForgetPasswordZodSchema),
  AuthController.forgetPassword
);

router.post(
  '/verify-email',
  validateRequest(AuthValidation.createVerifyEmailZodSchema),
  AuthController.verifyEmail
);

router.post(
  '/reset-password',
  validateRequest(AuthValidation.createResetPasswordZodSchema),
  AuthController.resetPassword  
);

router.post(
  '/change-password',
  auth(USER_ROLES.ADMIN, USER_ROLES.MENTOR, USER_ROLES.MENTEE),
  validateRequest(AuthValidation.createChangePasswordZodSchema),
  AuthController.changePassword
);

router.delete(
  '/delete-profile',
  auth(USER_ROLES.ADMIN, USER_ROLES.MENTOR, USER_ROLES.MENTEE),
  validateRequest(AuthValidation.createDeleteAccountZodSchema),
  AuthController.deleteAccount
);

export const AuthRoutes = router;
