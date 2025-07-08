import express from 'express';
import { TodoController } from './todo.controller';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import validateRequest from '../../middlewares/validateRequest';
import { TodoValidations } from './todo.validation';

const router = express.Router();

router.get('/:id',auth(USER_ROLES.MENTEE, USER_ROLES.MENTOR), TodoController.getTodoById);
router.post('/',auth(USER_ROLES.MENTEE, USER_ROLES.MENTOR), validateRequest(TodoValidations.createTodoZodSchema), TodoController.createToDo);
router.patch('/:id',auth(USER_ROLES.MENTEE, USER_ROLES.MENTOR), validateRequest(TodoValidations.updateTodoZodSchema), TodoController.updateTodo);
router.delete('/:id',auth(USER_ROLES.MENTEE, USER_ROLES.MENTOR), TodoController.deleteTodo);
router.get('/',auth(USER_ROLES.MENTEE, USER_ROLES.MENTOR), TodoController.getAllTodos); 
export const TodoRoutes = router;
