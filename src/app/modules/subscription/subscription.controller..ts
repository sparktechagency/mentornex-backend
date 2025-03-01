import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { StripeService } from './stripe.service';
import { SubscriptionService } from './subscription.service';
import { PlanType } from '../../../types/subscription.types';
import { User } from '../user/user.model';
import { PricingPlan } from '../mentorPricingPlan/pricing-plan.model';
import Stripe from 'stripe';
import { PaymentRecord } from '../payment-record/payment-record.model';
import { Subscription } from './subscription.model';
import stripe from '../../../config/stripe';
import sendResponse from '../../../shared/sendResponse';
import ApiError from '../../../errors/ApiError';
import catchAsync from '../../../shared/catchAsync';

  // Get all subscription plans a mentee can subscribe to
  
