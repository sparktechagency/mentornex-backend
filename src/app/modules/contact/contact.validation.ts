import { z } from 'zod';

const createContactZodSchema = z.object({
    body: z.object({
        question: z.string({ required_error: "Question is required" }),
        name: z.string({ required_error: "Name is required" }),
        email: z.string({ required_error: "Email is required" }),
        phone: z.string({ required_error: "Phone is required" }),
        jobTitle: z.string({ required_error: "Job Title is required" }),
    })
});

export const ContactValidation = {
    createContactZodSchema
};