import { NextFunction, Request, Response } from "express";
import { User } from "../modules/user/user.model";
import ApiError from "../../errors/ApiError";
import { StatusCodes } from "http-status-codes";
import stripe from "../../config/stripe";

const external_status_values = ['verified', 'new', 'validated'];

export const handleStripeCheck = async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
  
    try {
      // Check if the user exists
      const isUserExist = await User.findById(user.id);
      if (!isUserExist) {
        return next(new ApiError(StatusCodes.NOT_FOUND, 'User not found'));
      }
  
      // Validate Stripe account and customer IDs
      if (!isUserExist.stripe_account_id || !isUserExist.stripeCustomerId) {
        return next(new ApiError(StatusCodes.BAD_REQUEST, 'Before creating any services that require payment, you need to create a Stripe account'));
      }
  
      // Use Promise.all to parallelize Stripe API calls
      const [account, externalAccounts] = await Promise.all([
        stripe.accounts.retrieve(isUserExist.stripe_account_id),
        stripe.accounts.listExternalAccounts(isUserExist.stripe_account_id, { object: 'bank_account' }),
      ]);
  
      // Check if the Stripe account is enabled
      if (account.requirements?.disabled_reason) {
        return next(new ApiError(StatusCodes.BAD_REQUEST, `Your Stripe account is not enabled: ${account.requirements.disabled_reason}. Please update your account and try again.`));
      }
  
      // Validate external accounts (bank accounts)
      if (!externalAccounts.data.length) {
        return next(new ApiError(StatusCodes.BAD_REQUEST, 'Before creating any services that require payment, you need to add a bank account.'));
      }
  
      const verifiedAccount = externalAccounts.data.find(acc => external_status_values.includes(acc.status!));

      if (!verifiedAccount) {
       return next(new ApiError(StatusCodes.BAD_REQUEST, 'Your bank account is not verified. Please verify your bank account to proceed.'));
      }
  
      // If all checks pass, proceed to the next middleware
      next();
    } catch (error) {
      console.error('Error in handleStripeCheck:', error);
      next(new ApiError(StatusCodes.BAD_REQUEST, 'An error occurred while verifying your Stripe account.'));
    }
  };