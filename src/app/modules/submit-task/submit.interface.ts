import {Model, Types} from 'mongoose';

export interface ISubmit {
    taskId: Types.ObjectId;
    menteeId: Types.ObjectId;
    answer?: string;
    file?: string;
    status: 'reviewed' | 'pending';
    feedback?: string;
    createdAt: Date;
    updatedAt: Date;
}

export type SubmitModel = Model<ISubmit>;