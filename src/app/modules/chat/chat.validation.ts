import { z } from 'zod';
const createChatZodSchema = z.object({
  body: z.object({
    id: z.string({ required_error: 'Participant ID is required' })
  })
})
export const ChatValidations = { createChatZodSchema };
