import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import { FavoriteController } from './favorite.controller';

const router = express.Router();

router.route('/favorite-mentor').post(
  auth(USER_ROLES.MENTEE),
  FavoriteController.favoriteMentor
);

router.route('/favorite-mentor-list').get(
  auth(USER_ROLES.MENTEE),
  FavoriteController.getFavoriteMentorsController
);

export const MenteeFavoriteRoutes = router;