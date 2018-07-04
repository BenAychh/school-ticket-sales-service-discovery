import * as Datastore from '@google-cloud/datastore';
import { Request } from 'express-serve-static-core';
import * as HttpCodes from 'http-status-codes';
import { merge, omit } from 'ramda';
import { ILocalResponse } from '../../interfaces/LocalResponse';
import { ENDPOINT } from '../constants';
import { apiVersion } from '../helpers/apiVersion';
import { validatePayload } from '../helpers/validatePayload';
import { schema } from './validation';

export async function createEndpointHandler(datastore: Datastore, request: Request): Promise<ILocalResponse> {
  validatePayload(schema, request.body);

  const data = merge(omit(['name'], request.body), { updatedAt: new Date() });
  const key = datastore.key({
    namespace: ENDPOINT.NAMESPACE,
    path: [ENDPOINT.KIND, request.body.name],
  });

  return datastore.save({ key, data })
  .then(() => {
    return {
      body: {
        apiVersion: apiVersion(),
        data,
      },
      code: HttpCodes.CREATED,
    };
  });
}
