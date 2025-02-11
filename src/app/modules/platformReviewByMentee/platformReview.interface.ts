import { Model } from 'mongoose';
//import { USER_ROLES } from '../../../enums/user';


export type IPlatformReview = {
    mentee_id: string;
    rate: number;
    review: string;
};

export type PlatformReviewModal = Model<IPlatformReview>;