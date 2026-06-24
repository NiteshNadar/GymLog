import { Request, Response, NextFunction } from 'express';

interface AppError extends Error {
  statusCode?: number;
  code?: string;
  fields?: Record<string, string[]>;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = statusCode === 500 ? 'Internal server error' : err.message;

  // Log server errors in development
  if (statusCode === 500) {
    console.error('🔥 Internal Error:', err);
  }

  const errorResponse: {
    success: false;
    error: { code: string; message: string; fields?: Record<string, string[]> };
  } = {
    success: false,
    error: { code, message },
  };

  if (err.fields) {
    errorResponse.error.fields = err.fields;
  }

  res.status(statusCode).json(errorResponse);
}
