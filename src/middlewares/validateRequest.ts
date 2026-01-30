import { NextFunction, Request, Response } from 'express';
import * as z from 'zod';

const validateRequest = (schema: z.ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 1. Explicitly tell TS that the result will have body, query, and params
      const parsed = (await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      })) as { body: any; query: any; params: any }; 

      // 2. Assign body and params
      req.body = parsed.body;
      req.params = parsed.params;

      // 3. Force update the "read-only" query property
      Object.defineProperty(req, 'query', {
        value: parsed.query,
        writable: true,
        enumerable: true,
        configurable: true,
      });

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default validateRequest;