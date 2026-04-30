import { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Envuelve un handler async para que sus rejections lleguen al `errorHandler`
 * de Express en lugar de quedarse en `unhandledRejection`.
 */
export function asyncHandler<P, ResBody, ReqBody, ReqQuery>(
  fn: (
    req: Request<P, ResBody, ReqBody, ReqQuery>,
    res: Response<ResBody>,
    next: NextFunction,
  ) => Promise<unknown>,
): RequestHandler<P, ResBody, ReqBody, ReqQuery> {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
