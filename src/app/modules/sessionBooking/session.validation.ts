// import { z } from 'zod';

import { z } from 'zod';
import { PLAN_TYPE } from '../purchase/purchase.interface';
import { SESSION_STATUS } from './session.interface';

// const bookSessionZodSchema = z.object({
//   body: z.object({
//     mentee_id: z.string().optional(),
//     mentor_id: z.string({ required_error: 'Mentor id is required' }),
//     topic: z.string({ required_error: 'Topic is required' }),
//     duration: z.string({ required_error: 'Type is required' }),
//     expected_outcome: z.string({ required_error: 'Expected outcome is required' }),
//     fee: z.string().optional(),
//     status: z.string({ required_error: 'status is required' }),
//     payment_status: z.boolean({ required_error: 'Payment Status is required' }),
//     date_time: z.string({ required_error: 'Date and time is required' }),
//   }),
// });

// const updateSessionStatusZodSchema = z.object({
//   body: z.object({
//     sessionId: z.string({ required_error: 'Session ID is required' }),
//     status: z.enum(['accepted', 'rejected'], {
//       required_error: 'Status is required',
//     }),
//   }),
// });

// const updateUserZodSchema = z.object({
//   name: z.string().optional(),
//   contact: z.string().optional(),
//   email: z.string().optional(),
//   password: z.string().optional(),
//   location: z.string().optional(),
//   image: z.string().optional(),
// });

// export const SessionValidation = {
//   bookSessionZodSchema,
//   updateSessionStatusZodSchema,
//   updateUserZodSchema,
// };

const createSessionZodSchema = z.object({
  body: z.object({
    topic: z.string({ required_error: 'Topic is required' }),
    // duration: z.string({ required_error: 'Type is required' }),
    expected_outcome: z.string({
      required_error: 'Expected outcome is required',
    }),
    date: z.string({ required_error: 'Date is required' }),
    slot: z.string({ required_error: 'Slot is required' }),
    session_plan_type: z.enum(
      [PLAN_TYPE.Package, PLAN_TYPE.Subscription, PLAN_TYPE.PayPerSession],
      { required_error: 'Session plan type is required' }
    ),
    package_id: z.string().optional(),
    subscription_id: z.string().optional(),
    pay_per_session_id: z.string().optional(),
  }),
});

const updateSessionZodSchema = z.object({
  body: z.object({
    date: z.string().optional(),
    slot: z.string().optional(),
    status: z
      .enum([
        SESSION_STATUS.ACCEPTED,
        SESSION_STATUS.CANCELLED,
        SESSION_STATUS.COMPLETED,
        SESSION_STATUS.RESCHEDULED,
      ])
      .optional(),
  }),
});

export const SessionValidation = {
  createSessionZodSchema,
  updateSessionZodSchema,
};
