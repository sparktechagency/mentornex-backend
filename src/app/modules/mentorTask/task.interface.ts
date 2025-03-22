import { Model, Types } from 'mongoose';

export type ITask = {
    
    mentor_id: Types.ObjectId;
    mentee_id: Types.ObjectId;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    file: string;
    status: 'incomplete' | 'complete';
    assigned_date: Date;
    deadline: Date;
};

export type TaskModal = Model<ITask>;