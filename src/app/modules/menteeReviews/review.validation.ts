import {z} from 'zod';

const addReviewSchema = z.object({
    body: z.object({
      rate: z.number()
        .min(1, 'Rating must be at least 1')
        .max(5, 'Rating cannot exceed 5'),
      goalAchieved: z.number()
        .min(0, 'Goal achieved must be at least 0')
        .max(100, 'Goal achieved cannot exceed 100'),
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