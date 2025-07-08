import { z } from "zod"


const createNoteZodSchema = z.object({
    title:z.string({
        required_error:'Title is required'
    }),
    description:z.string().optional(),
   mentee_id:z.string({
    required_error:'Mentee id is required'
   }),
})

const updateNoteZodSchema = z.object({
    title:z.string().optional(),
    description:z.string().optional(),
    mentee_id:z.string().optional(),
})

export const NoteValidation = {
    createNoteZodSchema,
    updateNoteZodSchema
}