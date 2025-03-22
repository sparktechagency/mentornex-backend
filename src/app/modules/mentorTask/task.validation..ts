import { z } from 'zod';

const taskZodSchema = z.object({

    mentee_id: z.string().optional(),
    mentor_id: z.string().optional(),
    title: z.string({ required_error: 'Title is required' }),
    description: z.string().optional(),
    status: z.string().optional(),
    assigned_date: z.string().optional(),
    deadline: z.string().optional(),

});

export const TaskValidation = {
    taskZodSchema
  };