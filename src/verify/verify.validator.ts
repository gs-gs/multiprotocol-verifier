import Joi from 'joi';
import { ContainerTypes, ValidatedRequestSchema } from 'express-joi-validation';

export const verifySchema = Joi.object({
  qrCode: Joi.string().required(),
});

export interface IVerifyRequestSchema extends ValidatedRequestSchema {
  [ContainerTypes.Body]: {
    qrCode: string;
  };
}
