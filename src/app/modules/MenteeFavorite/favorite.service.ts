import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiError";
import { IFavorite } from "./favorite.interface";
import { FavoriteMentor } from "./favorite.model";
import { User } from "../user/user.model";

const addOrRemoveFavoriteToDB = async (payload: IFavorite): Promise<IFavorite> => {
  const { mentee_id, mentor } = payload;

  // Find existing favorite document for the mentee
  const existingFavorite = await FavoriteMentor.findOne({ mentee_id });

  if (existingFavorite) {
    // Add or remove mentors based on their presence
    mentor.forEach((mentorId) => {
      if (existingFavorite.mentor.includes(mentorId)) {
        // Remove mentor if already present
        existingFavorite.mentor = existingFavorite.mentor.filter(
          (id) => id !== mentorId
        );
      } else {
        // Add mentor if not present
        existingFavorite.mentor.push(mentorId);
      }
    });

    await existingFavorite.save();
    return existingFavorite;
  } else {
    // Create a new document if none exists
    const newFavorite = await FavoriteMentor.create({
      mentee_id,
      mentor,
    });

    return newFavorite;
  }
};

const getFavoriteMentors = async (menteeId: string) => {
  // Fetch the favorite mentors document for the given mentee
  const favorite = await FavoriteMentor.findOne({ mentee_id: menteeId });

  if (!favorite) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'No favorite mentors found for this mentee'
    );
  }

  // Extract mentor IDs
  const mentorIds = favorite.mentor;

  // Fetch mentor details from the User model
  const mentors = await User.find({ _id: { $in: mentorIds } });

  return mentors;
};


/*const addFavoriteToDB = async (payload: IFavorite): Promise<IFavorite> => {
    //set role
    //payload.role = USER_ROLES.USER;
    const addFavorite = await FavoriteMentor.create(payload);
    if (!addFavorite) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to add favorite');
    }
    return addFavorite;
};

const getFavoriteMentorsFromDB = async (mentee_id: string) => {
    const favoriteMentors = await FavoriteMentor.find({ mentee_id }).populate({
        path: 'mentor_id'
      })
      .exec();
    return favoriteMentors;
};

const deleteFavoriteMentorFromDB = async (mentee_id: string, mentor_id: string) => {
    const favoriteMentor = await FavoriteMentor.findOneAndDelete({ mentee_id, mentor_id });
    if (!favoriteMentor) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Favorite mentor not found');
    }
    return favoriteMentor;
};*/

export const FavoriteService = {
    addOrRemoveFavoriteToDB,
    getFavoriteMentors
};