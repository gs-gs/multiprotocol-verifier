import { Request, Response } from 'express';

import { HttpException } from 'common/exceptions';

export const errorMiddleware = (error: HttpException, request: Request, response: Response) => {
  const status = error.status || 500;
  const message = error.message || 'Something went wrong';

  response.status(status).send({
    status,
    message,
  });
};
