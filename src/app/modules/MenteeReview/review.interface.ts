import { Model } from 'mongoose';
//import { USER_ROLES } from '../../../enums/user';


export type IReview = {
    mentee_id: string;
    mentor_id: string;
    rate: number;
    review: string;
};

export type ReviewModal = Model<IReview>;