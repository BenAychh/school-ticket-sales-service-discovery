import * as Datastore from '@google-cloud/datastore';
import * as basicAuth from 'basic-auth';
import * as bcrypt from 'bcrypt';
import { Request } from 'express-serve-static-core';
import { curry } from 'ramda';
import { IAdmin } from '../interfaces/Admin';
import { handlerFunction } from '../interfaces/handlerFunction';
import { ILocalResponse } from '../interfaces/LocalResponse';
import { apiVersion } from './apiVersion';
import { DATABASE } from './constants';
import { logger } from './logging';
import { unathorizedResponse } from './responses/unauthorizedResponse';

export async function requireAuthorization(datastore, request, fn: handlerFunction) {
  if (await isPasswordValid(datastore, request)) {
    return fn(datastore, request);
  }
  return unathorizedResponse('Update Endpoint');
}

const dbGotUser: (user: any) => (result: any) => boolean = curry(
  (user: basicAuth.BasicAuthResult, result: [IAdmin]) => {
    if (!result) {
      return false;
    }
    return bcrypt.compareSync(user.pass, result[0].password);
  },
);

function dbFailure(error: Error) {
  logger.error(error);
  return false;
}

async function isPasswordValid(datastore: Datastore, request: Request): Promise<boolean> {
  const user = basicAuth(request);
  if (user) {
    const key = datastore.key({
      namespace: 'admin',
      path: ['Credential', user.name],
    });
    return datastore.get(key)
    .then(dbGotUser(user))
    .catch(dbFailure);
  }
  return false;
}
