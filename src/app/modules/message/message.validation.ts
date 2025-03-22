import { z } from "zod";

const createMessageZodSchema = z.object({
    content: z.string({ required_error: 'Content is required' }),
});
export const MessageValidation = {
    createMessageZodSchema
}