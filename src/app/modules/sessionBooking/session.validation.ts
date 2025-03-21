// import { z } from 'zod';

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