import { Model, Types } from 'mongoose';

export type IReply = {
  _id: Types.ObjectId;
  post: Types.ObjectId;
  repliedBy: Types.ObjectId;
  comment: string;
  upVotes: number;
  downVotes: number;
  parentReply?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export type IPost = {
  _id: Types.ObjectId;
  title: string;
  description: string;
  image?: string;
  postedBy: Types.ObjectId;
  isApproved: boolean;
  upVotes: number;
  downVotes: number;
  createdAt: Date;
  updatedAt: Date;
};

export type IVote = {
  postId: Types.ObjectId;
  replyId: Types.ObjectId;
  votedBy: Types.ObjectId;
  voteType: 'upVote' | 'downVote';
  createdAt: Date;
  updatedAt: Date;
};

export type PostModel = Model<IPost>;
export type ReplyModel = Model<IReply>;
export type VoteModel = Model<IVote>;

export type IPostFilters = {
  searchTerm?: string;
  isApproved?: boolean;
};
