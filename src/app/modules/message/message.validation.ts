import { z } from "zod";

const createMessageZodSchema = z.object({
    message: z.string().optional(),
});
export const MessageValidation = {
    createMessageZodSchema
}