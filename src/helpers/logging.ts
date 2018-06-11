import { createLogger, format, transports } from 'winston';

const enumerateErrorFormat = format((info: any) => {
  if (info.message instanceof Error) {
    info.message = Object.assign({
      message: info.message.message,
      stack: info.message.stack,
    }, info.message);
  }

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
