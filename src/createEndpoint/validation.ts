import * as Joi from 'joi';

const urls = Joi.object({
  blue: Joi.string().required(),
  green: Joi.string().required(),
}).required();

export const schema = Joi.object().keys({
  color: Joi.string().required().valid(['blue', 'green']),
  duration: Joi.number().required(),
  name: Joi.string().required(),
  urls,
});
