import { Request, Response, NextFunction } from 'express';
import { TodoServices } from './todo.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import pick from '../../../shared/pick';
import { paginationConstants } from '../../../types/pagination';
import { todo_filterable_fields } from './todo.constants';

const createToDo = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;
    
    payload.createdBy = req.user.id;
    const todo = await TodoServices.createTodo(payload);
    
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Todo created successfully',
        data: todo
    });
});

const getAllTodos = catchAsync(async (req: Request, res: Response) => {
    const filters = pick(req.query, todo_filterable_fields);
    const paginationOptions = pick(req.query, paginationConstants);
    const todos = await TodoServices.getAllTodos(req.user, filters, paginationOptions);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Todos fetched successfully',
        data: todos
    });
});

const getTodoById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const todo = await TodoServices.getTodoById(req.user, id);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Todo fetched successfully',
        data: todo
    });
});

const updateTodo = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const payload = req.body;
    const todo = await TodoServices.updateTodo(req.user, id, payload);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Todo updated successfully',
        data: todo
    });
});

const deleteTodo = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const todo = await TodoServices.deleteTodo(req.user, id);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Todo deleted successfully',
        data: todo
    });
});

export const TodoController = { 
    createToDo,
    getAllTodos,
    getTodoById,
    updateTodo,
    deleteTodo
};
