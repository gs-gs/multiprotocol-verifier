import { Request, Response, NextFunction, Router } from 'express';
import { ValidatedRequest, createValidator } from 'express-joi-validation';

import { IController } from 'common/interfaces';
import { verifyVDS } from 'common/utils/vds';
import { HttpException } from 'common/exceptions';

import { IVerifyRequestSchema, verifySchema } from './verify.validator';

export class VerifyController implements IController {
  public path = '/verify';
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    const validator = createValidator();
    this.router.post(this.path, validator.body(verifySchema), this.verify);
    this.router.post(`${this.path}/file`, this.verifyFile);
  }

  private verify = async (request: ValidatedRequest<IVerifyRequestSchema>, response: Response, next: NextFunction) => {
    try {
      const vaccinationCert = await verifyVDS(request.body.data, request.body.sig);
      response.json({
        success: true,
        data: vaccinationCert,
      });
    } catch (err: unknown) {
      next(new HttpException(500, err instanceof Error ? err.message : 'Something went wrong'));
    }
  };

  private verifyFile = async (request: Request, response: Response) => {
    response.json({
      success: true,
      data: 'file',
    });
  };
}
