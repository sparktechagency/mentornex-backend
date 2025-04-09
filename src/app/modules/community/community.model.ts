import { Schema, model } from 'mongoose';
import {
  IPost,
  IReply,
  IVote,
  PostModel,
  ReplyModel,
  VoteModel,
} from './community.interface';

const postSchema = new Schema<IPost, PostModel>(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    image: {
      type: String,
    },
    postedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    upVotes: {
      type: Number,
      default: 0,
    },
    downVotes: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const replySchema = new Schema<IReply, ReplyModel>(
  {
    post: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    repliedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    comment: {
      type: String,
      required: true,
    },
    upVotes: {
      type: Number,
      default: 0,
    },
    downVotes: {
      type: Number,
      default: 0,
    },
    parentReply: {
      type: Schema.Types.ObjectId,
      ref: 'Reply',
      default: null,
    },
  },
  { timestamps: true }
);

const voteSchema = new Schema<IVote, VoteModel>(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
    },
    replyId: {
      type: Schema.Types.ObjectId,
      ref: 'Reply',
    },
    votedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    voteType: {
      type: String,
      enum: ['upVote', 'downVote'],
      required: true,
    },
  },
  { timestamps: true }
);

export const Post = model<IPost, PostModel>('Post', postSchema);
export const Reply = model<IReply, ReplyModel>('Reply', replySchema);
export const Vote = model<IVote, VoteModel>('Vote', voteSchema);
