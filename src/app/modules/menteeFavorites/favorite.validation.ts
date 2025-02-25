import { z } from 'zod';
const favoriteMentorSchema = z.object({
  body: z.object({
    mentor_ids: z
      .array(
        z.string({
          required_error: 'Mentor ID is required',
          invalid_type_error: 'Mentor ID must be a string',
        })
      )
      .nonempty('At least one mentor ID is required'),
  }),
});

export const FavoriteValidation = {
  favoriteMentorSchema,
};
