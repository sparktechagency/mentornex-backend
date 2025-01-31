import { model, Schema } from 'mongoose';
import { IServiceReview, ServiceReviewModal } from './serviceReview.interface';

const serviceReviewSchema = new Schema<IServiceReview, ServiceReviewModal>(
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

export const ServiceReviewModel = model<IServiceReview, ServiceReviewModal>(
  'ServiceReview',
  serviceReviewSchema
);
