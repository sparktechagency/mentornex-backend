import e from 'cors';
import { z } from 'zod';

const createAdminZodSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required' }),
    email: z.string({ required_error: 'Email is required' }),
    role: z.string().optional(),
    industry: z.string({ required_error: 'Industry is required' }),
    timeZone: z.string({ required_error: 'timeZone is required' }),
    password: z.string({ required_error: 'Password is required' }),
    profile: z.string().optional(),
  }),
});

const updateAdminZodSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  role: z.string().optional(),
  industry: z.string().optional(),
  timeZone: z.string().optional(),
  password: z.string().optional(),
  phone: z.string().optional(),
  image: z.string().optional(),
  about: z.string().optional(),
  expertise: z.string().optional(),
  focus_area: z.string().optional(),
  language: z.string().optional(),
  job_title: z.string().optional(),
  company_name: z.string().optional(),
  education: z.string().optional(),
  social: z.array(
    z.object({
      platform: z.string().optional(),
      username: z.string().optional(),
    })
  ),
  institution_name: z.string().optional(),
  country: z.string().optional(),
  status: z.string().optional(),
  profile: z.string().optional(),

});

export const AdminValidation = {
  createAdminZodSchema,
  updateAdminZodSchema
};
