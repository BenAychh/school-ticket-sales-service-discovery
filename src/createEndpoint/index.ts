import * as Datastore from '@google-cloud/datastore';
import { DatastoreKey, DatastorePayload } from '@google-cloud/datastore/entity';
import { Request } from 'express-serve-static-core';
import * as HttpCodes from 'http-status-codes';
import { merge, omit } from 'ramda';
import { ILocalResponse } from '../../interfaces/LocalResponse';
import { ENDPOINT } from '../constants';
import { apiVersion } from '../helpers/apiVersion';
import { validatePayload } from '../helpers/validatePayload';
import { schema } from './validation';

const DOMAIN = 'Create Endpoint';
const KIND = ENDPOINT.KIND;
const NAMESPACE = (environment: string) => `${environment}-deployments`;

export async function createEndpointHandler(datastore: Datastore, request: Request): Promise<ILocalResponse> {
  validatePayload(schema, request.body);

  const data = merge(omit(['name', 'environment'], request.body), { updatedAt: new Date() });
  const key = datastore.key({
    namespace: NAMESPACE(request.body.environment),
    path: [KIND, request.body.name],
  });

  return datastore.save({ key, data })
  .then(() => {
    return {
      body: {
        apiVersion: apiVersion(),
        data,
      },
      code: HttpCodes.OK,
    };
  });
}
