import { Request } from 'express-serve-static-core';
import { ILocalResponse } from '../interfaces/LocalResponse';
import * as packageInfo from '../package.json';

export function helloWorld(request: Request): ILocalResponse {
  return {
    body: {
      apiVersion: packageInfo.version,
      data: {
        message: 'Hello World',
      },
    },
    code: 200,
  };
}
