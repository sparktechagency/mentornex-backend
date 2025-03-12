import { z } from "zod";

const createOrUpdateOtherZodSchema = z.object({
    body:z.object({
        content: z.string({required_error:"Content is required."}),
        type: z.enum(['termsAndConditions' , 'privacyPolicy'],{required_error:"Type is required"})
    })
})

export const OthersValidations = { createOrUpdateOtherZodSchema };