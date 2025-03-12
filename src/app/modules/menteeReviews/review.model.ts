import { model, Schema } from "mongoose";
import { IReview, ReviewModal } from "./review.interface";

const reviewSchema = new Schema<IReview, ReviewModal>(
    {
        mentee_id: {
            type: String,
            ref: 'User',
            required: true,
          },
        mentor_id: {
            type: String,
            ref: 'User',
            required: true,
        },
        goalAchieved: {
            type: Number,
            required: true,
        },
        rate: {
          type: Number,
          required: true,
        },
        review: {
          type: String,
        }
    },
    { timestamps: true }
  );

export const ReviewMentor = model<IReview, ReviewModal>('ReviewMentor', reviewSchema);