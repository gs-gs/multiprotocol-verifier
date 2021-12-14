import Joi from 'joi';
import { ContainerTypes, ValidatedRequestSchema } from 'express-joi-validation';

export const verifySchema = Joi.object({
  data: Joi.object().required(),
  sig: Joi.object().required(),
});

export interface IVerifyRequestSchema extends ValidatedRequestSchema {
  [ContainerTypes.Body]: {
    data: VDSDataInput;
    sig: VDSSignatureInput;
  };
}
