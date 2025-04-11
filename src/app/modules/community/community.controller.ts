import { Request, Response, NextFunction } from 'express';
import { CommunityServices } from './community.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import pick from '../../../shared/pick';
import { paginationConstants } from '../../../types/pagination';
import { communityPostFilterableFields } from './community.constants';
import { getSingleFilePath } from '../../../shared/getFilePath';

const createPost = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;

  payload.image = getSingleFilePath(req.files, 'image');

  console.log(payload);

  const result = await CommunityServices.createCommunityPost(req.user, payload);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Post created successfully',
    data: result,
  });
});

const updatePost = catchAsync(async (req: Request, res: Response) => {
  req.body.image = getSingleFilePath(req.files, 'image');

  const result = await CommunityServices.updatePost(
    req.user,
    req.params.id,
    req.body
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Post updated successfully',
    data: result,
  });
});

const deletePost = catchAsync(async (req: Request, res: Response) => {
  const result = await CommunityServices.deletePost(req.user, req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Post deleted successfully',
    data: result,
  });
});

const votePost = catchAsync(async (req: Request, res: Response) => {
  const result = await CommunityServices.votePost(
    req.user,
    req.params.id,
    req.body.voteType
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Post voted successfully',
    data: result,
  });
});

const voteReply = catchAsync(async (req: Request, res: Response) => {
  const result = await CommunityServices.voteReply(
    req.user,
    req.params.id,
    req.body.voteType
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Reply voted successfully',
    data: result,
  });
});

const replyToPost = catchAsync(async (req: Request, res: Response) => {
  const result = await CommunityServices.replyToPost(
    req.user,
    req.params.id,
    req.body
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Reply created successfully',
    data: result,
  });
});
const replyToReply = catchAsync(async (req: Request, res: Response) => {
  const result = await CommunityServices.replyToReply(
    req.user,
    req.params.id,
    req.body
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Reply created successfully',
    data: result,
  });
});

const editReply = catchAsync(async (req: Request, res: Response) => {
  const result = await CommunityServices.editReply(
    req.user,
    req.params.id,
    req.body
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Reply updated successfully',
    data: result,
  });
});
const deleteReply = catchAsync(async (req: Request, res: Response) => {
  const result = await CommunityServices.deleteReply(req.user, req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Reply deleted successfully',
    data: result,
  });
});

const toggleApprovalForPost = catchAsync(
  async (req: Request, res: Response) => {
    const result = await CommunityServices.toggleApprovalForPost(req.params.id);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Post approved successfully',
      data: result,
    });
  }
);

const getAllPosts = catchAsync(async (req: Request, res: Response) => {
  const pagination = pick(req.query, paginationConstants);
  const filters = pick(req.query, communityPostFilterableFields);
  const result = await CommunityServices.getAllPosts(filters, pagination);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Posts retrieved successfully',
    data: result,
  });
});

const getReplyByReplyId = catchAsync(async (req: Request, res: Response) => {
  const result = await CommunityServices.getReplyByReplyId(
    req.user,
    req.params.id
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Reply retrieved successfully',
    data: result,
  });
});

export const CommunityController = {
  createPost,
  updatePost,
  deletePost,
  votePost,
  voteReply,
  replyToPost,
  replyToReply,
  editReply,
  deleteReply,
  toggleApprovalForPost,
  getAllPosts,
  getReplyByReplyId,
};
