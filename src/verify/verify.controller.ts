import { Request, Response, NextFunction, Router } from 'express';
import { ValidatedRequest, createValidator } from 'express-joi-validation';

import { HttpException } from '../common/exceptions';
import { IController } from '../common/interfaces';
import { certUploadMiddleware } from '../common/middlewares';
import { getQRCodeData } from '../common/utils/qr';
import { verifyQRCode, verifyVDS } from '../common/utils/cert';

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
      const logs: string[] = [];

      const vaccinationCert = await verifyVDS(request.body.data, request.body.sig, logs);
      response.json({
        success: true,
        data: vaccinationCert,
        logs,
      });
    } catch (err: unknown) {
      next(new HttpException(500, err instanceof Error ? err.message : 'Something went wrong'));
    }
  };

  private verifyFile = async (request: Request, response: Response, next: NextFunction) => {
    try {
      if (!request.file) {
        throw new Error('Error uploading file.');
      }

      const base64 = request.file.buffer.toString('base64');

      const qrCode = await getQRCodeData(base64);

      if (!qrCode.data) {
        response.json({
          success: false,
          data: null,
          logs: qrCode.logs,
        });
        return;
      }

      let verifyResult;

      if (typeof qrCode.data === 'string') {
        verifyResult = await verifyQRCode(qrCode.data);
      } else {
        // Verify all QR codes
        const verifyResults: Array<{ success: boolean; data: VaccinationCert | null; logs: string[] }> =
          await Promise.all(qrCode.data.map(async (data) => await verifyQRCode(data)));

        verifyResult = verifyResults[0];

        for (const verifyItem of verifyResults) {
          if (verifyItem.success) {
            verifyResult = verifyItem;
          }
        }
      }

      response.json({
        ...verifyResult,
        logs: [...qrCode.logs, ...verifyResult.logs],
      });
    } catch (err: unknown) {
      next(new HttpException(500, err instanceof Error ? err.message : 'Something went wrong'));
    }
  };
}
