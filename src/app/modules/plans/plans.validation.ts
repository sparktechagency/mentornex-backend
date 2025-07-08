import { z } from 'zod';

const createPayPerSessionSchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'Title is required' }),
    description: z.string({ required_error: 'Description is required' }),
    amount: z.number({ required_error: 'Amount is required' }),
    duration: z.string({ required_error: 'Duration is required' }).optional(),
  }),
});

const updatePayPerSessionSchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'Title is required' }).optional(),
    description: z
      .string({ required_error: 'Description is required' })
      .optional(),
    amount: z.number({ required_error: 'Amount is required' }).optional(),
    duration: z.string({ required_error: 'Duration is required' }).optional(),
  }),
});

const createPackageSchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'Title is required' }),
    description: z.string({ required_error: 'Description is required' }),
    amount: z.number({ required_error: 'Amount is required' }),
    sessions: z.number({ required_error: 'Total sessions is required' }),
  }),
});

const updatePackageSchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'Title is required' }).optional(),
    description: z
      .string({ required_error: 'Description is required' })
      .optional(),
    amount: z.number({ required_error: 'Amount is required' }).optional(),
    sessions: z
      .number({ required_error: 'Total sessions is required' })
      .optional(),
  }),
});

const createSubscriptionSchema = z.object({
  body: z.object({
    // title: z.string({ required_error: 'Title is required' }),
    // description: z.string({ required_error: 'Description is required' }),
    amount: z.number({ required_error: 'Amount is required' }),
    // sessions: z.number({ required_error: 'Total sessions is required' }).optional(),
  }),
});

const updateSubscriptionSchema = z.object({
  body: z.object({
    // title: z.string({ required_error: 'Title is required' }).optional(),
    // description: z
    //   .string({ required_error: 'Description is required' })
    //   .optional(),
    amount: z.number({ required_error: 'Amount is required' }).optional(),
    // sessions: z
    //   .number({ required_error: 'Total sessions is required' })
    //   .optional(),
  }),
});

export const PlansValidations = {
  createPayPerSessionSchema,
  updatePayPerSessionSchema,
  createPackageSchema,
  updatePackageSchema,
  createSubscriptionSchema,
  updateSubscriptionSchema,
};
