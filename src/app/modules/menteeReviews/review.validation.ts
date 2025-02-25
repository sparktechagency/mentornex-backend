import {z} from 'zod';

const addReviewSchema = z.object({
    body: z.object({
      rate: z.number()
        .min(1, 'Rating must be at least 1')
        .max(5, 'Rating cannot exceed 5'),
      review: z.string()
        .optional()
    }),
    params: z.object({
      mentor_id: z.string({
        required_error: 'Mentor ID is required'
      })
    })
  });
  
  const deleteReviewSchema = z.object({
    params: z.object({
      mentor_id: z.string({
        required_error: 'Mentor ID is required'
      })
    })
  });
  
  export const ReviewValidation = {
    addReviewSchema,
    deleteReviewSchema
  };