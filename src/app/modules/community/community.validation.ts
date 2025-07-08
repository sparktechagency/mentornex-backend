import { z } from 'zod';

const createPostZodSchema = z.object({
  title: z.string({
    required_error: 'Title is required',
  }),
  description: z.string({
    required_error: 'Description is required',
  }),
});

const updatePostZodSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
});

const createReplyZodSchema = z.object({
  comment: z.string({
    required_error: 'Reply is required',
  }),
});

const updateReplyZodSchema = z.object({
  comment: z.string().optional(),
});

const createVoteZodSchema = z.object({
  body: z.object({
    voteType: z.enum(['upVote', 'downVote']),
  }),
});
const updateVoteZodSchema = z.object({
  body: z.object({
    voteType: z.enum(['upVote', 'downVote']).optional(),
  }),
});

export const CommunityValidations = {
  createPostZodSchema,
  updatePostZodSchema,
  createReplyZodSchema,
  updateReplyZodSchema,
  createVoteZodSchema,
  updateVoteZodSchema,
};
