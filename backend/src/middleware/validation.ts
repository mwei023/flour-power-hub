import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export interface ValidatedRequest extends Request {
  validatedData?: unknown;
}

export const validateRequest = <T>(schema: ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validatedData = schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
      });
      
      // Attach validated data to request
      (req as ValidatedRequest).validatedData = validatedData;
      next();
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
};

// Async error handler
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// API response helpers
export const successResponse = <T>(res: Response, data: T, message?: string, statusCode: number = 200) => {
  res.status(statusCode).json({
    success: true,
    data,
    message,
  });
};

export const errorResponse = (res: Response, message: string, statusCode: number = 400, error?: unknown) => {
  const response: { success: boolean; error: string; details?: unknown } = {
    success: false,
    error: message,
  };
  
  if (error !== undefined) {
    response.details = error;
  }
  
  res.status(statusCode).json(response);
};

// Pagination helper
export const getPaginationParams = (query: Record<string, string | undefined>) => {
  const page = Math.max(1, parseInt(query['page'] || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(query['limit'] || '20')));
  const offset = (page - 1) * limit;
  
  return { page, limit, offset };
};

export const createPaginationResponse = <T>(data: T[], total: number, page: number, limit: number) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};
