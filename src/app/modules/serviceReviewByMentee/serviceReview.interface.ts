import { Model } from 'mongoose';
//import { USER_ROLES } from '../../../enums/user';


export type IServiceReview = {
    mentee_id: string;
    rate: number;
    review: string;
};

export type ServiceReviewModal = Model<IServiceReview>;