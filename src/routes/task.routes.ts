import { Router } from 'express';
import { TaskController } from '../controllers/task.controller';

const controller = new TaskController();
export const taskRouter = Router();

taskRouter.post('/', controller.create);
taskRouter.get('/', controller.list);
taskRouter.get('/:id', controller.get);
taskRouter.put('/:id', controller.replace);
taskRouter.patch('/:id', controller.update);
taskRouter.delete('/:id', controller.delete);
