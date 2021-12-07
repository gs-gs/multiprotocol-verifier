import { NextFunction, Request, Response } from 'express';

import { logger } from 'common/utils/logger';

export const loggerMiddleware = (request: Request, response: Response, next: NextFunction) => {
  logger.info(`${request.method} ${request.path}`);
  next();
};
