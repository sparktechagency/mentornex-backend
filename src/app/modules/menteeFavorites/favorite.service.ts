import { getMentorsWithReviewsAndPrices } from './../../../util/mentorStat';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { User } from '../user/user.model';
import { IFavorite } from './favorite.interface';
import { FavoriteMentor } from './favorite.model';
import { JwtPayload } from 'jsonwebtoken';
import e from 'cors';

const addOrRemoveFavoriteToDB = async (user: JwtPayload, mentorId: string) => {
  const existingFavorite = await FavoriteMentor.findOne({
    mentee_id: user.id,
    mentor: mentorId,
  });

  if (existingFavorite) {
    await FavoriteMentor.findOneAndUpdate(
      { mentee_id: user.id, mentor: mentorId },
      { $pull: { mentor: mentorId } }
    );
  } else {
    await FavoriteMentor.findOneAndUpdate(
      { mentee_id: user.id },
      { $push: { mentor: mentorId } },
      { upsert: true }
    );
  }
};

const getFavoriteMentors = async (menteeId: string) => {
  const favorite = await FavoriteMentor.findOne({ mentee_id: menteeId });

  if (!favorite) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'No favorite mentors found for this mentee'
    );
  }

  const mentorIds = favorite.mentor;

  const mentors = await User.find({ _id: { $in: mentorIds } }).lean();

  const mentorsWithDetails = await getMentorsWithReviewsAndPrices(mentors);

  return mentorsWithDetails;
};

export const FavoriteService = {
  addOrRemoveFavoriteToDB,
  getFavoriteMentors,
};
