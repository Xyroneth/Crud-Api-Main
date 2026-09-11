import { NextFunction, Request, Response } from 'express';
import { TaskService } from '../services/task.service';
import {
  createTaskSchema,
  listTasksSchema,
  replaceTaskSchema,
  updateTaskSchema,
} from '../validation/task.schemas';

export class TaskController {
  constructor(private readonly service = new TaskService()) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(201).json({ data: await this.service.create(createTaskSchema.parse(req.body)) });
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.service.list(listTasksSchema.parse(req.query)));
    } catch (error) {
      next(error);
    }
  };

  get = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ data: await this.service.get(req.params.id!) });
    } catch (error) {
      next(error);
    }
  };

  replace = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({
        data: await this.service.update(req.params.id!, replaceTaskSchema.parse(req.body)),
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({
        data: await this.service.update(req.params.id!, updateTaskSchema.parse(req.body)),
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.delete(req.params.id!);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
