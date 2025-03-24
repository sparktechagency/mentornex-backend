import { z } from 'zod';

const taskZodSchema = z.object({

    mentee_id: z.string(),
    title: z.string({ required_error: 'Title is required' }),
    description: z.string({ required_error: 'Description is required' }),
    deadline: z.string({ required_error: 'Deadline is required' }),

});

export const TaskValidation = {
    taskZodSchema
  };