import { Model } from 'mongoose';
//import { USER_ROLES } from '../../../enums/user';


export type IFavorite = {
    mentee_id: string;
    mentor: string[];
};

export type FavoriteModal = Model<IFavorite>;