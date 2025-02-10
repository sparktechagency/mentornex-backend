import { Model } from 'mongoose';
export type IReview = {
    mentee_id: string;
    mentor_id: string;
    rate: number;
    review: string;
};

export type ReviewModal = Model<IReview>;