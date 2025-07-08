import { Schema, Types, model } from 'mongoose';
import { ITodo, TodoModel, TodoPriority, TodoStatus } from './todo.interface'; 

const todoSchema = new Schema<ITodo, TodoModel>({
  title: {
    type: String,
    required: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
  },
  priority: {
    type: String,
    enum: [TodoPriority.LOW, TodoPriority.MEDIUM, TodoPriority.HIGH],
    default: TodoPriority.LOW
  },
  status: {
    type: String,
    enum: [TodoStatus.IN_PROGRESS, TodoStatus.PENDING, TodoStatus.COMPLETED],
    default: TodoStatus.PENDING
  },
  assignedDate: {
    type: Date,
    default: new Date()
  },
  deadline: {
    type: Date
  }
}, { timestamps: true });

export const Todo = model<ITodo, TodoModel>('Todo', todoSchema);
