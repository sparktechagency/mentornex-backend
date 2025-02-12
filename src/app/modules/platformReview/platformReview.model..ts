import { model, Schema } from 'mongoose';
import { IPlatformReview, PlatformReviewModal } from './platformReview.interface';

const platformReviewSchema = new Schema<IPlatformReview, PlatformReviewModal>(
  {
    mentee_id: {
      type: String,
      ref: 'User',
      required: true,
    },
    rate: {
      type: Number,
      required: true,
    },
    review: {
      type: String,
    },
  },
  { timestamps: true }
);

export const PlatformReviewModel = model<IPlatformReview, PlatformReviewModal>(
  'PlatformReview',
  platformReviewSchema
);
