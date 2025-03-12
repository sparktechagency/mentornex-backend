import { z } from 'zod';
const createIndustryZodSchema = z.object({
  name: z.string({ required_error: 'Name is required' }),
  description: z.string({ required_error: 'Description is required' }),
  
})

const updateIndustryZodSchema = z.object({
    description: z.string().optional(),
    name: z.string().optional(),
})

export const IndustryValidations = { createIndustryZodSchema, updateIndustryZodSchema };
