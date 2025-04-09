import { JwtPayload } from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { IPost, IReply } from './community.interface';
import { Post, Reply, Vote } from './community.model';

const createCommunityPost = async (
  user: JwtPayload,
  payload: IPost
): Promise<IPost> => {
  payload.postedBy = user.id;
  const result = await Post.create(payload);
  if (!result)
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Failed to create community post.'
    );
  return result;
};

const toggleApprovalForPost = async (id: string) => {
  const post = await Post.findById(id);
  if (!post) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Post not found');
  }
  post.isApproved = !post.isApproved;
  await post.save();
  return post.isApproved
    ? 'Post approved successfully.'
    : 'Post approved successfully.';
};

const updatePost = async (
  user: JwtPayload,
  id: string,
  payload: Partial<IPost>
) => {
  const post = await Post.findById(id);
  if (!post) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Post not found');
  }
  if (post.postedBy.toString() !== user.id) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'You are not authorized to update this post.'
    );
  }
  const updatedPost = await Post.findByIdAndUpdate(
    id,
    { $set: payload },
    {
      new: true,
    }
  );

  if (!updatedPost) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to update post.');
  }

  return 'Post updated successfully.';
};

const deletePost = async (user: JwtPayload, id: string) => {
  const post = await Post.findById(id);
  if (!post) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Post not found');
  }

  if (post.postedBy.toString() !== user.id) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'You are not authorized to delete this post.'
    );
  }

  //start transaction
  const session = await Post.startSession();
  try {
    session.startTransaction();

    await Promise.all([
      post.deleteOne({ session }),
      Reply.deleteMany({ post: id }, { session }),
      Vote.deleteMany({ post: id }, { session }),
    ]);

    await session.commitTransaction();
    session.endSession();
  } catch (error) {
    session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

//replies stuff!
const replyToPost = async (
  user: JwtPayload,
  postId: string,
  payload: IReply
) => {
  const post = await Post.findById(postId);
  if (!post) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Post not found');
  }

  const result = await Reply.create([
    {
      post: postId,
      comment: payload.comment,
      repliedBy: user.id,
    },
  ]);
  if (!result) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `Failed to reply to ${post.title}`
    );
  }
};

const replyToReply = async (
  user: JwtPayload,
  replyId: string,
  payload: IReply
) => {
  const existingReply = await Reply.findById(replyId);
  if (!existingReply) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Reply not found');
  }
  const result = await Reply.create([
    {
      post: existingReply.post,
      reply: replyId,
      comment: payload.comment,
      repliedBy: user.id,
      parentReply: replyId,
    },
  ]);

  if (!result.length) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `Failed to reply to ${existingReply.comment}`
    );
  }
};

const editReply = async (
  user: JwtPayload,
  replyId: string,
  payload: Partial<IReply>
) => {
  const reply = await Reply.findById(replyId);
  if (!reply) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Reply not found');
  }
  if (reply.repliedBy.toString() !== user.id) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'You are not authorized to update this reply.'
    );
  }
  const updatedReply = await Reply.findByIdAndUpdate(
    replyId,
    { $set: payload },
    {
      new: true,
    }
  );
  if (!updatedReply) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to update reply.');
  }
  return 'Reply updated successfully.';
};

const deleteReply = async (user: JwtPayload, replyId: string) => {
  const reply = await Reply.findById(replyId);
  if (!reply) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Reply not found');
  }
  if (reply.repliedBy.toString() !== user.id) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'You are not authorized to delete this reply.'
    );
  }
  //delete all replies with this replyId and their children
  const session = await Post.startSession();
  try {
    session.startTransaction();
    await Promise.all([
      reply.deleteOne({ session }),
      Reply.deleteMany({ parentReply: replyId }, { session }),
      Vote.deleteMany({ reply: replyId }, { session }),
    ]);

    await session.commitTransaction();
    session.endSession();
    return 'Reply deleted successfully.';
  } catch (error) {
    session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

//voting stuff!
const votePost = async (
  user: JwtPayload,
  postId: string,
  voteType: 'upVote' | 'downVote'
) => {
  const session = await Post.startSession();
  try {
    session.startTransaction();

    const existingVote = await Vote.findOne({
      postId: postId,
      votedBy: user.id,
    });

    // Case 1: No existing vote - create new vote
    if (!existingVote) {
      await Vote.create(
        [
          {
            postId,
            votedBy: user.id,
            voteType,
          },
        ],
        { session }
      );

      await Post.findByIdAndUpdate(
        postId,
        {
          $inc: {
            [voteType === 'upVote' ? 'upVotes' : 'downVotes']: 1,
          },
        },
        { session }
      );

      await session.commitTransaction();
      return 'Post voted successfully.';
    }

    // Case 2: Same vote type - remove vote (toggle off)
    if (existingVote.voteType === voteType) {
      await existingVote.deleteOne({ session });

      await Post.findByIdAndUpdate(
        postId,
        {
          $inc: {
            [voteType === 'upVote' ? 'upVotes' : 'downVotes']: -1,
          },
        },
        { session }
      );

      await session.commitTransaction();
      return 'Post unvoted successfully.';
    }

    // Case 3: Different vote type - switch vote type
    await existingVote.deleteOne({ session });

    await Vote.create(
      [
        {
          postId,
          votedBy: user.id,
          voteType,
        },
      ],
      { session }
    );

    // Single update operation for switching vote types
    await Post.findByIdAndUpdate(
      postId,
      {
        $inc: {
          upVotes: voteType === 'upVote' ? 1 : -1,
          downVotes: voteType === 'downVote' ? 1 : -1,
        },
      },
      { session }
    );

    await session.commitTransaction();
    return 'Post vote updated successfully.';
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const voteReply = async (
  user: JwtPayload,
  replyId: string,
  voteType: 'upVote' | 'downVote'
) => {
  const session = await Post.startSession();
  try {
    session.startTransaction();

    const [existingVote, existingReply] = await Promise.all([
      Vote.findOne({
        replyId: replyId,
        votedBy: user.id,
      }),
      Reply.findById(replyId),
    ]);
    if (!existingReply) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Reply not found');
    }

    // Case 1: No existing vote - create new vote
    if (!existingVote) {
      await Vote.create(
        [
          {
            post: existingReply.post,
            replyId,
            votedBy: user.id,
            voteType,
          },
        ],
        { session }
      );

      await Reply.findByIdAndUpdate(
        replyId,
        {
          $inc: {
            [voteType === 'upVote' ? 'upVotes' : 'downVotes']: 1,
          },
        },
        { session }
      );

      await session.commitTransaction();
      return 'Post voted successfully.';
    }

    // Case 2: Same vote type - remove vote (toggle off)
    if (existingVote.voteType === voteType) {
      await existingVote.deleteOne({ session });

      await Reply.findByIdAndUpdate(
        replyId,
        {
          $inc: {
            [voteType === 'upVote' ? 'upVotes' : 'downVotes']: -1,
          },
        },
        { session }
      );

      await session.commitTransaction();
      return 'Post unvoted successfully.';
    }

    // Case 3: Different vote type - switch vote type
    await existingVote.deleteOne({ session });

    await Vote.create(
      [
        {
          post: existingReply.post,
          votedBy: user.id,
          voteType,
        },
      ],
      { session }
    );

    // Single update operation for switching vote types
    await Reply.findByIdAndUpdate(
      replyId,
      {
        $inc: {
          upVotes: voteType === 'upVote' ? 1 : -1,
          downVotes: voteType === 'downVote' ? 1 : -1,
        },
      },
      { session }
    );

    await session.commitTransaction();
    return 'Post vote updated successfully.';
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const CommunityServices = {
  createCommunityPost,
  toggleApprovalForPost,
  updatePost,
  deletePost,
  votePost,
  voteReply,
  replyToPost,
  replyToReply,
  editReply,
  deleteReply,
};
