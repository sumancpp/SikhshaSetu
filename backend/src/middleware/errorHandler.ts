import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  errors?: any;
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let code = err.code || 'INTERNAL_ERROR';

  // Handle Mongoose Duplicate Key Error
  if ((err as any).code === 11000) {
    const field = Object.keys((err as any).keyValue || {})[0] || 'field';
    message = `A record with this ${field} already exists.`;
    code = 'DUPLICATE_ENTRY';
    res.status(409).json({
      success: false,
      message,
      code,
    });
    return;
  }

  // Handle Multer File Size Error
  if (err.message && err.message.includes('File too large')) {
    res.status(400).json({
      success: false,
      message: `File size exceeds the maximum limit of ${env.MAX_FILE_SIZE_MB}MB.`,
      code: 'FILE_TOO_LARGE',
    });
    return;
  }

  // Safe Production Response
  const response: Record<string, any> = {
    success: false,
    message,
    code,
  };

  if (err.errors) {
    response.errors = err.errors;
  }

  if (env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
