import {Model} from 'mongoose';

export interface ISubmit {
    taskId: string;
    menteeId: string;
    answer?: string;
    file?: string;
    status?: 'reviewed' | 'pending';
    feedback?: string;
    createdAt: Date;
    updatedAt: Date;
}

export type SubmitModel = Model<ISubmit>;