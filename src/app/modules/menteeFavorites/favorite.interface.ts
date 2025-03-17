import { Model, Types } from 'mongoose';

export type IFavorite = {
    mentee_id: Types.ObjectId;
    mentor: Types.ObjectId[];
};

export type FavoriteModal = Model<IFavorite>;