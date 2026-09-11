import { Request, Response } from 'express';

export function notFound(req: Request, res: Response): void {
  res
    .status(404)
    .json({
      error: { code: 'ROUTE_NOT_FOUND', message: `Route ${req.method} ${req.path} not found` },
    });
}
