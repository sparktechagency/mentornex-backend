import { z } from 'zod';

const addContentZodSchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'Title is required' }),
    description: z.string().optional(),
    url: z.string({ required_error: 'URL is required' }),
    type: z.enum(['intro', 'tutorial'], { required_error: 'Type is required' }),
  }),
});

const updateContentZodSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    url: z.string().optional(),
    type: z.enum(['intro', 'tutorial']).optional(),
  }),
});

export const ContentValidations = { addContentZodSchema, updateContentZodSchema };
