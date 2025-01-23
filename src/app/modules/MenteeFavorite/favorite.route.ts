import express, { NextFunction, Request, Response } from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { FavoriteController } from './favorite.controller';

const router = express.Router();

router.route('/favorite/add').post(
  auth(USER_ROLES.MENTEE),
  FavoriteController.addfavoriteMentor
);
router.route('/favorite/list').get(
    auth(USER_ROLES.MENTEE),
    FavoriteController.getFavoriteMentors
);

router.route('/favorite/delete').delete(
    auth(USER_ROLES.MENTEE),
    FavoriteController.deleteFavoriteMentor
);

export const MenteeFavoriteRoutes = router;