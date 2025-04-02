import { JwtPayload } from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { ITodo, TodoFilters, TodoModel } from './todo.interface';
import { Todo } from './todo.model';
import { IPaginationOptions } from '../../../types/pagination';
import { paginationHelper } from '../../../helpers/paginationHelper';
import { todo_searchable_fields } from './todo.constants';
const createTodo = async (payload: ITodo) => {
  const todo = await Todo.create(payload);
  if(!todo) throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create todo');
  return todo;
};

const getAllTodos = async (user:JwtPayload, filters: TodoFilters, paginationOptions:IPaginationOptions) => {
    const { searchTerm, ...otherFilters } = filters;
    const {page, skip, limit, sortBy, sortOrder} = paginationHelper.calculatePagination(paginationOptions);
    const anyCondition = [];

    if(searchTerm){
        todo_searchable_fields.forEach(field => {
            anyCondition.push({[field]: {$regex: searchTerm, $options: 'i'}});
        })
    }

    if(Object.keys(otherFilters).length > 0){
       anyCondition.push({$and: Object.entries(otherFilters).map(([field, value]) => ({[field]: value}))});
    }

    const whereCondition = anyCondition.length > 0 ? { $and: anyCondition } : {};
    const todos = await Todo.find({ createdBy: user.id, ...whereCondition }).skip(skip).limit(limit).sort({[sortBy]: sortOrder});
    const total = await Todo.countDocuments({ createdBy: user.id, ...whereCondition });
    return {
        meta: {
            page,
            limit,
            skip,
            total,
            totalPages: Math.ceil(total / limit)
        },
        data: todos
    };
};

const getTodoById = async (user:JwtPayload, id: string) => {
  const todo = await Todo.findById(id);
  if(!todo) throw new ApiError(StatusCodes.BAD_REQUEST, 'Todo not found');
  if(todo.createdBy.toString() !== user.id) throw new ApiError(StatusCodes.BAD_REQUEST, 'You are not authorized to access this todo');
  return todo;
};

const updateTodo = async (user:JwtPayload, id: string, payload: Partial<ITodo>) => {

    const isTodoExist = await Todo.findById(id);
    if(!isTodoExist) throw new ApiError(StatusCodes.BAD_REQUEST, 'Todo not found');
    if(isTodoExist.createdBy.toString() !== user.id) throw new ApiError(StatusCodes.BAD_REQUEST, 'You are not authorized to update this todo');

    const todo = await Todo.findByIdAndUpdate(id, {$set: payload}, { new: true });
    if(!todo) throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to update todo');
    return todo;
};

const deleteTodo = async (user:JwtPayload, id: string) => {
  const isTodoExist = await Todo.findById(id);
  if(!isTodoExist) throw new ApiError(StatusCodes.BAD_REQUEST, 'Todo not found');
  if(isTodoExist.createdBy.toString() !== user.id) throw new ApiError(StatusCodes.BAD_REQUEST, 'You are not authorized to delete this todo');

  const todo = await Todo.findByIdAndDelete(id);
  if(!todo) throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to delete todo');
  return todo;
};

export const TodoServices = { 
  createTodo,
  getAllTodos,
  getTodoById,
  updateTodo,
  deleteTodo
};
