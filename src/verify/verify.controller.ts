import { Request, Response, NextFunction, Router } from 'express';
import { ValidatedRequest, createValidator } from 'express-joi-validation';
import { readFile } from 'fs';

import { HttpException } from 'common/exceptions';
import { IController } from 'common/interfaces';
import { certUploadMiddleware } from 'common/middlewares';
import { getQRCodeData } from 'common/utils/qr';
import { verifyQRCode, verifyVDS } from 'common/utils/cert';

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
    this.router.post(`${this.path}/file`, certUploadMiddleware, this.verifyFile);
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

          const base64 = buffer.toString('base64');

          try {
            const qrCode = await getQRCodeData(base64);
            const verifyResult = await verifyQRCode(qrCode);
            resolve(verifyResult);
            return;
          } catch (verifyErr) {
            reject(new Error(`Error verifying QR Code: ${verifyErr}`));
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
