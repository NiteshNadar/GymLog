import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export function validate(schemas: ValidationSchemas | ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if ('parse' in schemas) {
        schemas.parse(req.body);
      } else {
        if (schemas.body) req.body = schemas.body.parse(req.body);
        if (schemas.query) {
          const parsed = schemas.query.parse(req.query);
          for (const key in req.query) delete req.query[key];
          Object.assign(req.query, parsed);
        }
        if (schemas.params) {
          const parsed = schemas.params.parse(req.params);
          for (const key in req.params) delete req.params[key];
          Object.assign(req.params, parsed);
        }
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const fields: Record<string, string[]> = {};
        for (const issue of error.issues) {
          const path = issue.path.join('.');
          if (!fields[path]) fields[path] = [];
          fields[path].push(issue.message);
        }

        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            fields,
          },
        });
        return;
      }
      next(error);
    }
  };
}
