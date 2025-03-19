import { z } from 'zod';

const createPayPerSessionSchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'Title is required' }).min(3).max(100),
    description: z.string({ required_error: 'Description is required' }).min(3).max(1000),
    amount: z.number({ required_error: 'Amount is required' }).min(1),
    duration: z.string({ required_error: 'Duration is required' }).min(3).max(100),
    sessions: z.number({ required_error: 'Total sessions is required' }).min(1),
  }),
});

const updatePayPerSessionSchema = z.object({
    body: z.object({
        title: z.string({ required_error: 'Title is required' }).min(3).max(100).optional(),
        description: z.string({ required_error: 'Description is required' }).min(3).max(1000).optional(),
        amount: z.number({ required_error: 'Amount is required' }).min(1).optional()   ,
        duration: z.string({ required_error: 'Duration is required' }).min(3).max(100).optional(),
        sessions: z.number({ required_error: 'Total sessions is required' }).min(1).optional(),
      })
});

const createPackageSchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'Title is required' }).min(3).max(100),
    description: z.string({ required_error: 'Description is required' }).min(3).max(1000),
    amount: z.number({ required_error: 'Amount is required' }).min(1),
    duration: z.string({ required_error: 'Duration is required' }).min(3).max(100),
    sessions: z.number({ required_error: 'Total sessions is required' }).min(1),
  }),
});

const updatePackageSchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'Title is required' }).min(3).max(100).optional(),
    description: z.string({ required_error: 'Description is required' }).min(3).max(1000).optional(),
    amount: z.number({ required_error: 'Amount is required' }).min(1).optional()   ,
    duration: z.string({ required_error: 'Duration is required' }).min(3).max(100).optional(),
    sessions: z.number({ required_error: 'Total sessions is required' }).min(1).optional(),
  })
});


const createSubscriptionSchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'Title is required' }).min(3).max(100),
    description: z.string({ required_error: 'Description is required' }).min(3).max(1000),
    amount: z.number({ required_error: 'Amount is required' }).min(1),
    duration: z.string({ required_error: 'Duration is required' }).min(3).max(100),
    sessions: z.number().min(1),
  }),
});

const updateSubscriptionSchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'Title is required' }).min(3).max(100).optional(),
    description: z.string({ required_error: 'Description is required' }).min(3).max(1000).optional(),
    amount: z.number({ required_error: 'Amount is required' }).min(1).optional()   ,
    duration: z.string({ required_error: 'Duration is required' }).min(3).max(100).optional(),
    sessions: z.number({ required_error: 'Total sessions is required' }).min(1).optional(),
  })
});




export const PlansValidations = {  createPayPerSessionSchema, updatePayPerSessionSchema, createPackageSchema, updatePackageSchema, createSubscriptionSchema, updateSubscriptionSchema };
