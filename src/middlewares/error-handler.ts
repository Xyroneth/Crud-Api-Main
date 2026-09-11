import { ErrorRequestHandler } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { AppError } from '../utils/app-error';
import { logger } from '../utils/logger';

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  if (error instanceof ZodError) {
    res
      .status(400)
      .json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request', details: error.flatten() },
      });
    return;
  }
  if (error instanceof mongoose.Error.CastError) {
    res.status(400).json({ error: { code: 'INVALID_ID', message: 'Invalid resource identifier' } });
    return;
  }
  if (error instanceof AppError) {
    res
      .status(error.statusCode)
      .json({
        error: {
          code: error.code,
          message: error.message,
          ...(error.details === undefined ? {} : { details: error.details }),
        },
      });
    return;
  }
  logger.error({ err: error, requestId: req.requestId }, 'Unhandled request error');
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
};
