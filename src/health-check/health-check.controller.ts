import { Request, Response, Router } from 'express';

import { IController } from '../common/interfaces';

export class HealthCheckController implements IController {
  public path = '/health-check';
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(this.path, this.check);
  }

  private check = async (request: Request, response: Response) => {
    response.json({
      status: 'ok',
    });
  };
}
