import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiError";
import { IFavorite } from "./favorite.interface";
import { FavoriteMentor } from "./favorite.model";


const addFavoriteToDB = async (payload: IFavorite): Promise<IFavorite> => {
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
};

export const FavoriteService = {
    addFavoriteToDB,
    getFavoriteMentorsFromDB,
    deleteFavoriteMentorFromDB
};