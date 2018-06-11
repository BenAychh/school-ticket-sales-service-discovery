import * as Joi from 'joi';
import { JoiObject } from 'joi';

export function validatePayload(schema: JoiObject, payload): void {
  const result = Joi.validate(payload, schema);
  if (result.error) {
    throw result.error;
  }
}
