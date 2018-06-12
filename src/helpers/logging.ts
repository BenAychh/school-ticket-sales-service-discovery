import { createLogger, format, transports } from 'winston';

/* istanbul ignore next */
const enumerateErrorFormat = format((info: any) => {
  if (info instanceof Error) {
    return Object.assign({
      message: info.message,
      stack: info.stack,
    }, info);
  }
  return info;
});

export const logger = createLogger({
  format: format.combine(
    enumerateErrorFormat(),
    format.json(),
  ),
  transports: [
    new transports.Console(),
  ],
});
