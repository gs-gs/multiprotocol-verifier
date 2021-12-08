import { NextFunction, Request, Response } from 'express';

import { HttpException } from 'common/exceptions';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const joiErrorMiddleware = (err: any, request: Request, response: Response, next: NextFunction) => {
  if (err && err.error && err.error.isJoi) {
    next(new HttpException(400, err.error.toString()));
  } else {
    next(err);
  }
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorMiddleware = (error: HttpException, request: Request, response: Response, next: NextFunction) => {
  const status = error.status || 500;
  const message = error.message || 'Something went wrong';

  response.status(status).send({
    status,
    message,
  });
};
