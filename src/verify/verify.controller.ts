import { Request, Response, NextFunction, Router } from 'express';
import { ValidatedRequest, createValidator } from 'express-joi-validation';
import { readFile } from 'fs';

import { certUploader } from 'common/utils/cert-file';
import { IController } from 'common/interfaces';
import { verifyVDS, verifyVDSImageOrPDF } from 'common/utils/vds';
import { HttpException } from 'common/exceptions';

import { IVerifyRequestSchema, verifySchema } from './verify.validator';

export class VerifyController implements IController {
  public path = '/verify';
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    const validator = createValidator({ passError: true });
    this.router.post(this.path, validator.body(verifySchema), this.verify);
    this.router.post(`${this.path}/file`, certUploader, this.verifyFile);
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

  private verifyFile = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const vaccinationCert = await new Promise((resolve, reject) => {
        if (!request.file) {
          reject(new Error('Error uploading file.'));
          return;
        }

        readFile(request.file.path, async (err, buffer) => {
          if (err) {
            reject(err);
          }

          try {
            const base64 = buffer.toString('base64');
            const verifyResult = await verifyVDSImageOrPDF(base64);
            resolve(verifyResult);
          } catch (verifyErr) {
            reject(verifyErr);
          }
        });
      });

      response.json({
        success: true,
        data: vaccinationCert,
      });
    } catch (err: unknown) {
      next(new HttpException(500, err instanceof Error ? err.message : 'Something went wrong'));
    }
  };
}
