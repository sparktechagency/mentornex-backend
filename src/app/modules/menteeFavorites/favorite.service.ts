import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiError";
import { User } from "../user/user.model";
import { IFavorite } from "./favorite.interface";
import { FavoriteMentor } from "./favorite.model";
import { getMentorsWithReviewsAndPrices } from "../../../util/mentorStat";

const addOrRemoveFavoriteToDB = async (payload: IFavorite): Promise<IFavorite> => {
  const { mentee_id, mentor } = payload;
  const existingFavorite = await FavoriteMentor.findOne({ mentee_id });

  if (existingFavorite) {
    mentor.forEach((mentorId) => {
      if (existingFavorite.mentor.includes(mentorId)) {
        
        existingFavorite.mentor = existingFavorite.mentor.filter(
          (id) => id !== mentorId
        );
      } else {
        
        existingFavorite.mentor.push(mentorId);
      }
    });

    await existingFavorite.save();
    return existingFavorite;
  } else {
    
    const newFavorite = await FavoriteMentor.create({
      mentee_id,
      mentor,
    });

    return newFavorite;
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
    getFavoriteMentors
};