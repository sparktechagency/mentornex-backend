import { z } from 'zod';
import { TodoPriority, TodoStatus } from './todo.interface';

const createTodoZodSchema = z.object({
    body:z.object({
        title: z.string({ required_error: 'Title is required' }),
        description: z.string().optional(),
        priority: z.enum([TodoPriority.LOW, TodoPriority.MEDIUM, TodoPriority.HIGH]).optional(),
        status: z.enum([TodoStatus.IN_PROGRESS, TodoStatus.PENDING, TodoStatus.COMPLETED]).optional(),
        assignedDate: z.string().optional(),
        deadline: z.string().optional()
    })
})

const updateTodoZodSchema = z.object({
    body: z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        priority: z.enum([TodoPriority.LOW, TodoPriority.MEDIUM, TodoPriority.HIGH]).optional(),
        status: z.enum([TodoStatus.IN_PROGRESS, TodoStatus.PENDING, TodoStatus.COMPLETED]).optional(),
        assignedDate: z.string().optional(),
        deadline: z.string().optional()
    })
})

export const TodoValidations = { createTodoZodSchema, updateTodoZodSchema };
