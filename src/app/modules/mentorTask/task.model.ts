import { model, Schema } from "mongoose";
import { ITask, TaskModal } from "./task.interface";


const TaskSchema = new Schema<ITask, TaskModal>(
    {
        
        mentor_id: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        mentee_id: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
          },
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
        file: {
            type: String,
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'urgent'],
            default: 'low'
        },
        status: {
            type: String,
            enum: ['incomplete', 'complete'],
            default: 'incomplete'
        },
        assigned_date: {
            type: Date,
            default: Date.now()
        },
        deadline: {
            type: Date,
        }
        
    },
    { timestamps: true }
  );

export const Task = model<ITask, TaskModal>('Task', TaskSchema);