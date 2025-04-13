import { populate } from 'dotenv';
import { JwtPayload } from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { IPost, IPostFilters, IReply } from './community.interface';
import { Post, Reply, Vote } from './community.model';
import { IPaginationOptions } from '../../../types/pagination';
import { paginationHelper } from '../../../helpers/paginationHelper';
import { communityPostSearchableFields } from './community.constants';
import { startSession } from 'mongoose';
import sendNotification, {
  sendDataWithSocket,
} from '../../../helpers/sendNotificationHelper';

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

const toggleApprovalForPost = async (user: JwtPayload, id: string) => {
  const post = await Post.findById(id).populate('postedBy', 'name image');
  if (!post) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Post not found');
  }
  post.isApproved = !post.isApproved;
  await post.save();

  sendNotification('getNotification', {
    senderId: user.id,
    receiverId: post.postedBy.toString(),
    title: post.title,
    message: post.isApproved
      ? `Hello ${name}, your post with ${post.title} has been approved.`
      : `Hello ${name}, your post with ${post.title} has been rejected.`,
  });

  sendDataWithSocket('newPost', 'newPost', post);

  return post.isApproved
    ? 'Post approved successfully.'
    : 'Post approved successfully.';
};

const updatePost = async (
  user: JwtPayload,
  id: string,
  payload: Partial<IPost>
) => {
  const post = await Post.findById(id).populate('postedBy', 'name image');
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

  sendDataWithSocket('updatedPost', 'updatedPost', updatedPost);

  return 'Post updated successfully.';
};

const deletePost = async (user: JwtPayload, id: string) => {
  const post = await Post.findById(id).populate('postedBy', 'name image');
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
    sendDataWithSocket('deletedPost', 'deletedPost', post);
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
  const post = await Post.findById(postId).populate<{
    postedBy: { name: string; image: string };
  }>('postedBy', 'name image');
  if (!post) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Post not found');
  }
  const session = await startSession();
  try {
    session.startTransaction();

    const result = await Reply.create(
      [
        {
          post: postId,
          comment: payload.comment,
          repliedBy: user.id,
        },
      ],
      { session }
    );

    if (!result.length) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `Failed to reply to ${post.title}`
      );
    }

    //push the newly created reply to the post's replies array
    const isPostUpdated = await Post.findByIdAndUpdate(
      postId,
      { $push: { replies: result[0]._id } },
      { session, new: true }
    );

    if (!isPostUpdated) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `Failed to update ${post.title} post replies array with new reply id.`
      );
    }

    await session.commitTransaction();

    const replyPopulatedData = await result[0].populate<{
      repliedBy: { name: string; image: string };
    }>('repliedBy', 'name image');

    sendNotification('getNotification', {
      senderId: user.id,
      receiverId: post.postedBy.toString(),
      title: post.title,
      message: `Hello ${post.postedBy.name}, ${replyPopulatedData.repliedBy.name} has replied to your post.`,
    });
    sendDataWithSocket('newReply', post._id.toString(), replyPopulatedData);

    return 'Reply added successfully.';
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const replyToReply = async (
  user: JwtPayload,
  replyId: string,
  payload: IReply
) => {
  const existingReply = await Reply.findById(replyId).populate<{
    repliedBy: { name: string; image: string };
  }>('repliedBy', 'name image');
  if (!existingReply) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Reply not found');
  }

  const post = await Post.findById(existingReply.post, { title: 1 }).populate<{
    postedBy: { name: string; image: string };
  }>('postedBy', 'name image');
  if (!post) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Post not found');
  }

  const session = await startSession();
  try {
    session.startTransaction();

    const result = await Reply.create(
      [
        {
          post: existingReply.post,
          comment: payload.comment,
          repliedBy: user.id,
          parentReply: replyId,
        },
      ],
      { session }
    );

    if (!result.length) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `Failed to reply to ${existingReply.comment}`
      );
    }

    //push the newly created reply to the post's replies array
    const isReplyUpdated = await Reply.findByIdAndUpdate(
      existingReply._id,
      { $push: { repliesOfReply: result[0]._id } },
      { session, new: true }
    );

    if (!isReplyUpdated) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `Failed to update ${existingReply.comment} reply replies array with new reply id.`
      );
    }

    await session.commitTransaction();

    const replyPopulatedData = await result[0].populate<{
      repliedBy: { name: string; image: string };
    }>('repliedBy', 'name image');
    sendNotification('getNotification', {
      senderId: user.id,
      receiverId: existingReply.repliedBy.toString(),
      title: existingReply.comment,
      message: `Hello ${existingReply.repliedBy.name}, ${replyPopulatedData.repliedBy.name} has replied to your reply in ${post.title}.`,
    });

    sendDataWithSocket(
      'newReply',
      existingReply.post.toString(),
      replyPopulatedData
    ); // Assuming postId is the ID of the post to which the reply belongs, not the ID of the reply itself. If you want to send the reply itself, you can use replyPopulatedData her

    return 'Reply added successfully.';
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const editReply = async (
  user: JwtPayload,
  replyId: string,
  payload: Partial<IReply>
) => {
  const reply = await Reply.findById(replyId).populate<{
    repliedBy: { name: string; image: string };
  }>('repliedBy', 'name image');
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

  reply.comment = updatedReply.comment || reply.comment;

  sendDataWithSocket('updatedReply', reply.post.toString(), reply);

  return 'Reply updated successfully.';
};

const deleteReply = async (user: JwtPayload, replyId: string) => {
  const reply = await Reply.findById(replyId);
  if (!reply) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Reply not found');
  }
  // if (reply.repliedBy.toString() !== user.id) {
  //   throw new ApiError(
  //     StatusCodes.FORBIDDEN,
  //     'You are not authorized to delete this reply.'
  //   );
  // }
  //delete all replies with this replyId and their children
  const session = await startSession();
  try {
    session.startTransaction();
    await Promise.all([
      reply.deleteOne({ session }),
      Reply.deleteMany({ parentReply: replyId }, { session }),
      Vote.deleteMany({ replyId: replyId }, { session }),
      // Handle parent reference update separately
      reply.parentReply
        ? Reply.findByIdAndUpdate(
            reply.parentReply,
            { $pull: { repliesOfReply: replyId } },
            { session }
          )
        : Post.findByIdAndUpdate(
            reply.post,
            { $pull: { replies: replyId } },
            { session }
          ),
    ]);

    await session.commitTransaction();

    sendDataWithSocket('deletedReply', reply.post.toString(), reply);

    return 'Reply deleted successfully.';
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

//voting stuff!
const votePost = async (
  user: JwtPayload,
  postId: string,
  voteType: 'upVote' | 'downVote'
) => {
  const session = await startSession();
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
            voteType: voteType,
          },
        ],
        { session }
      );

      const updatedVote = await Post.findByIdAndUpdate(
        postId,
        {
          $inc: {
            [voteType === 'upVote' ? 'upVotes' : 'downVotes']: 1,
          },
        },
        { session }
      );

      await session.commitTransaction();
      sendDataWithSocket('votedPost', postId, {
        upVotes: updatedVote?.upVotes,
        downVotes: updatedVote?.downVotes,
      });
      return 'Post voted successfully.';
    }

    // Case 2: Same vote type - remove vote (toggle off)
    if (existingVote.voteType === voteType) {
      await existingVote.deleteOne({ session });

      const updatedVote = await Post.findByIdAndUpdate(
        postId,
        {
          $inc: {
            [voteType === 'upVote' ? 'upVotes' : 'downVotes']: -1,
          },
        },
        { session }
      );

      await session.commitTransaction();
      sendDataWithSocket('votedPost', postId, {
        upVotes: updatedVote?.upVotes,
        downVotes: updatedVote?.downVotes,
      });
      return 'Post unvoted successfully.';
    }

    // Case 3: Different vote type - switch vote type
    await existingVote.deleteOne({ session });

    await Vote.create(
      [
        {
          postId: postId,
          votedBy: user.id,
          voteType,
        },
      ],
      { session }
    );

    // Single update operation for switching vote types
    const updatedVote = await Post.findByIdAndUpdate(
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
    sendDataWithSocket('votedPost', postId, {
      upVotes: updatedVote?.upVotes,
      downVotes: updatedVote?.downVotes,
    });
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
  const session = await startSession();
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
            replyId: replyId,
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
          replyId: replyId,
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

const getAllPosts = async (
  filters: IPostFilters,
  paginationOptions: IPaginationOptions
) => {
  const { page, skip, sortBy, sortOrder, limit } =
    paginationHelper.calculatePagination(paginationOptions);

  const { searchTerm, ...filtersData } = filters;
  const andConditions = [];

  if (searchTerm) {
    andConditions.push({
      $or: communityPostSearchableFields.map(field => ({
        [field]: {
          $regex: searchTerm,
          $options: 'i',
        },
      })),
    });
  }
  if (Object.keys(filtersData).length) {
    andConditions.push({
      $and: Object.entries(filtersData).map(([field, value]) => ({
        [field]: value,
      })),
    });
  }

  andConditions.push({
    isApproved: true,
  });

  const whereConditions =
    andConditions.length > 0 ? { $and: andConditions } : {};
  const result = await Post.find(whereConditions)
    .populate({
      path: 'postedBy',
      select: 'name image',
    })
    .populate({
      path: 'replies',
      populate: [
        {
          path: 'repliedBy',
          select: 'name  image ',
        },
        {
          path: 'repliesOfReply',
          select: 'comment repliedBy createdAt updatedAt upVotes downVotes',
          populate: [
            {
              path: 'repliedBy',
              select: 'name  image ',
            },
            {
              path: 'repliesOfReply',
              select: 'comment repliedBy createdAt updatedAt upVotes downVotes',
              populate: {
                path: 'repliedBy',
                select: 'name  image ',
              },
            },
          ],
        },
      ],
    })
    .limit(limit)
    .skip(skip)
    .sort({ [sortBy]: sortOrder })
    .lean();

  const total = await Post.countDocuments(whereConditions);
  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: result,
  };
};

const getMyPosts = async (user: JwtPayload) => {
  const result = await Post.find({ postedBy: user.id })
    .populate({
      path: 'postedBy',
      select: 'name image',
    })
    .lean();
  return result;
};
const getSinglePost = async (id: string) => {
  const result = await Post.findById(id)
    .populate({
      path: 'postedBy',
      select: 'name image',
    })
    .lean();
  return result;
};

const getReplyByReplyId = async (user: JwtPayload, id: string) => {
  const result = await Reply.find({ parentReply: id })
    .populate({
      path: 'repliedBy',
      select: 'name image',
    })
    .lean();
  return result;
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
  getAllPosts,
  getReplyByReplyId,
};
