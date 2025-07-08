import { model, Schema } from "mongoose";
import { FavoriteModal, IFavorite } from "./favorite.interface";


const favoriteSchema = new Schema<IFavorite, FavoriteModal>(
    {
        mentee_id: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
          },
        mentor: {
            type: [Schema.Types.ObjectId],
            ref: 'User',
            required: true,
      }
    },
    { timestamps: true }
  );

export const FavoriteMentor = model<IFavorite, FavoriteModal>('FavoriteMentor', favoriteSchema);