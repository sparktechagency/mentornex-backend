import express, { NextFunction, Request, Response } from 'express';
import { CommunityController } from './community.controller';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { CommunityValidations } from './community.validation';
import fileUploadHandler from '../../middlewares/fileUploadHandler';
import validateRequest from '../../middlewares/validateRequest';

const router = express.Router();
router.post(
  '/create-post',
  auth(USER_ROLES.USER, USER_ROLES.MENTEE, USER_ROLES.MENTOR),
  fileUploadHandler(),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      req.body = CommunityValidations.createPostZodSchema.parse(
        JSON.parse(req.body.data)
      );
    }
    CommunityController.createPost(req, res, next);
  }
);
router.patch(
  '/update-post/:id',
  auth(USER_ROLES.USER, USER_ROLES.MENTEE, USER_ROLES.MENTOR),
  fileUploadHandler(),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      req.body = CommunityValidations.updatePostZodSchema.parse(
        JSON.parse(req.body.data)
      );
    }
    CommunityController.updatePost(req, res, next);
  }
);
router.delete(
  '/delete-post/:id',
  auth(USER_ROLES.MENTEE, USER_ROLES.MENTOR, USER_ROLES.SUPER_ADMIN),
  CommunityController.deletePost
);
router.post(
  '/vote-to-post/:id',
  auth(USER_ROLES.MENTEE, USER_ROLES.MENTOR),
  validateRequest(CommunityValidations.createVoteZodSchema),
  CommunityController.votePost
);
router.post(
  '/vote-to-reply/:id',
  auth(USER_ROLES.MENTEE, USER_ROLES.MENTOR),
  validateRequest(CommunityValidations.createVoteZodSchema),
  CommunityController.voteReply
);
router.post(
  '/reply-to-post/:id',
  auth(USER_ROLES.MENTEE, USER_ROLES.MENTOR),
  CommunityController.replyToPost
);
router.post(
  '/reply-to-reply/:id',
  auth(USER_ROLES.MENTEE, USER_ROLES.MENTOR),
  CommunityController.replyToReply
);
router.patch(
  '/edit-reply/:id',
  auth(USER_ROLES.MENTEE, USER_ROLES.MENTOR),
  CommunityController.editReply
);
router.delete(
  '/delete-reply/:id',
  auth(USER_ROLES.MENTEE, USER_ROLES.MENTOR),
  CommunityController.deleteReply
);

router.post(
  '/toggle-approval/:id',
  auth(
    USER_ROLES.ADMIN,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.MENTEE,
    USER_ROLES.MENTOR
  ),
  CommunityController.toggleApprovalForPost
);

router.get(
  '/all-posts',
  auth(
    USER_ROLES.MENTEE,
    USER_ROLES.MENTOR,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN
  ),
  CommunityController.getAllPosts
);

router.get(
  '/replies/:id',
  auth(
    USER_ROLES.MENTEE,
    USER_ROLES.MENTOR,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN
  ),
  CommunityController.getReplyByReplyId
);
// router.get(
//   '/my-posts',
//   auth(USER_ROLES.MENTEE, USER_ROLES.MENTOR),
//   CommunityController.getMyPosts
// );
// router.get('/post/:id', CommunityController.getSinglePost);
// router.get(
//   '/my-replies',
//   auth(USER_ROLES.MENTEE, USER_ROLES.MENTOR),
//   CommunityController.getMyReplies
// );

export const CommunityRoutes = router;
