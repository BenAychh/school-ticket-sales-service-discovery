import * as Datastore from '@google-cloud/datastore';
import { DatastoreKey, DatastorePayload } from '@google-cloud/datastore/entity';
import { Request } from 'express-serve-static-core';
import * as HttpCodes from 'http-status-codes';
import { merge } from 'ramda';
import { IEndpoint } from '../../interfaces/Endpoint';
import { ILocalResponse } from '../../interfaces/LocalResponse';
import { ENDPOINT } from '../constants';
import { apiVersion } from '../helpers/apiVersion';
import { validatePayload } from '../helpers/validatePayload';
import { schema } from './validation';

export async function flipEndpointHandler(datastore: Datastore, request: Request): Promise<ILocalResponse> {
  validatePayload(schema, request.body);
  const key = datastore.key({
    namespace: ENDPOINT.NAMESPACE,
    path: [ENDPOINT.KIND, request.body.name],
  });

  return datastore.get(key)
  .then((dbResults) => handleEndpointReponse(request, key, datastore, dbResults));
}

function handleEndpointReponse(request: Request, key: DatastoreKey, datastore: Datastore, [dbResults]) {
  checkForDbResults(request, dbResults);
  checkColorIsNotAlreadyFlipped(request, dbResults);
  const updatedEndpoint = merge(dbResults, {
    color: request.body.color,
    duration: request.body.duration,
    updatedAt: new Date(),
  });
  const entity: DatastorePayload<IEndpoint> = {
    data: updatedEndpoint,
    key,
  };
  return datastore.save(entity).then(updatedResponse(updatedEndpoint));
}

function updatedResponse(updatedEndpoint: IEndpoint): () => ILocalResponse {
  return () => {
    return {
      body: {
        apiVersion: apiVersion(),
        data: updatedEndpoint,
      },
      code: HttpCodes.OK,
    };
  };
}

function checkForDbResults(request: Request, results): void {
  if (!results) {
    const error = new Error(`No endpoint named ${request.body.name}`);
    error.name = 'NotFoundError';
    throw error;
  }
}

function checkColorIsNotAlreadyFlipped(request, results: IEndpoint): void {
  if (request.body.color === results.color) {
    const message = `Color on ${request.body.name} is already ${request.body.color}`;
    const error = new Error(message);
    error.name = 'ConflictError';
    throw error;
  }
}
