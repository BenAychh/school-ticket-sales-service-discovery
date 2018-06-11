import * as Joi from 'joi';

export const schema = Joi.object().keys({
  color: Joi.string().required().valid(['blue', 'green']),
  duration: Joi.number().required(),
  environment: Joi.string().required().valid(['staging', 'prod']),
  name: Joi.string().required(),
});
