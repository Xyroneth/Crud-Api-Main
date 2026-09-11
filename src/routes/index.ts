import { Router } from 'express';
import { taskRouter } from './task.routes';

export const apiRouter = Router();
apiRouter.get('/egg', (_req, res) =>
  res.json({ data: { message: 'You found the productivity egg! 🥚' } }),
);
apiRouter.use('/tasks', taskRouter);
