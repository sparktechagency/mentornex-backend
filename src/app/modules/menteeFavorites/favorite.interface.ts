import { Model } from 'mongoose';

export type IFavorite = {
    mentee_id: string;
    mentor: string[];
};

export type FavoriteModal = Model<IFavorite>;