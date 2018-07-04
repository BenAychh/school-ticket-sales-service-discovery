import * as Joi from 'joi';

export const schema = Joi.object().keys({
  color: Joi.string().required().valid(['blue', 'green']),
  duration: Joi.number().required(),
  name: Joi.string().required(),
});
