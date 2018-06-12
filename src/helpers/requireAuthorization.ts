import * as Datastore from '@google-cloud/datastore';
import * as basicAuth from 'basic-auth';
import * as bcrypt from 'bcrypt';
import { Request } from 'express-serve-static-core';
import { curry } from 'ramda';
import { IAdmin } from '../../interfaces/Admin';
import { logger } from './logging';

export async function requireAuthorization(datastore, request) {
  const validPassword = await isPasswordValid(datastore, request);
  if (!validPassword) {
    const error = new Error('Invalid username or password');
    error.name = 'AuthorizationError';
    throw error;
  }
}

type curriedGotUserHandler = (user: any) => (result: any) => boolean;
const dbGotUser: curriedGotUserHandler = curry((user: basicAuth.BasicAuthResult, result: [IAdmin]) => {
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
