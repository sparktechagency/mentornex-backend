import { Model, Types } from 'mongoose';

export enum TodoStatus {
  IN_PROGRESS = 'in_progress',
  PENDING = 'pending',
  COMPLETED = 'completed',
}
export enum TodoPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export type ITodo = {
  _id:Types.ObjectId;
  title: string;
  createdBy: Types.ObjectId;
  description: string;
  priority: TodoPriority;
  status: TodoStatus;
  assignedDate: Date;
  deadline: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type TodoFilters ={
  searchTerm?: string;
  priority?: TodoPriority;
  status?: TodoStatus;
}

export type TodoModel = Model<ITodo>;
