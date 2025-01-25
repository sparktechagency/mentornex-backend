import { Model } from 'mongoose';


export type ITask = {
    mentor_id: string;
    mentee_id: string;
    title: string;
    description: string;
    status: 'incomplete' | 'complete';
    assigned_date: Date;
    deadline: Date;
};

export type TaskModal = Model<ITask>;