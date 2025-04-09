import { Request, Response, NextFunction } from 'express';
import { CommunityServices } from './community.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';

const createPost = catchAsync(async (req: Request, res: Response) => {
  const result = await CommunityServices.createCommunityPost(
    req.user,
    req.body
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Post created successfully',
    data: result,
  });
});

const updatePost = catchAsync(async (req: Request, res: Response) => {
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
    req.body
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
    req.body
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
};
