import * as Datastore from '@google-cloud/datastore';
import { DatastoreKey, DatastorePayload } from '@google-cloud/datastore/entity';
import * as bcrypt from 'bcrypt';
import { Request } from 'express-serve-static-core';
import * as HttpCodes from 'http-status-codes';
import { merge } from 'ramda';
import { IEndpoint } from '../interfaces/Endpoint';
import { ILocalResponse } from '../interfaces/LocalResponse';
import { apiVersion } from './apiVersion';
import { isPasswordValid } from './isPasswordValid';
import { createErrorBody, createErrorResponse, createInstanceError } from './responses/errorResponse';
import { unathorizedResponse } from './responses/unauthorizedResponse';

const DOMAIN = 'Flip Endpoint';
const KIND = 'Endpoint';
const NAMESPACE = 'staging-deployments';

export async function flipEndpoint(datastore: Datastore, request: Request): Promise<ILocalResponse> {
  const key = datastore.key({
    namespace: request.body.namespace,
    path: [KIND, request.body.endpoint],
  });

  return datastore.get(key)
  .then((response) => handleEndpointReponse(request, key, datastore, response));
}

function handleEndpointReponse(request: Request, key: DatastoreKey, datastore: Datastore, response) {
  if (!response) {
    return notFoundResponse(request);
  }
  const updatedEndpoint = merge(response[0], {
    color: request.body.color,
    duration: request.body.duration,
    updatedAt: new Date(),
  });
  const entity: DatastorePayload<IEndpoint> = {
    data: updatedEndpoint,
    key,
  };
  return datastore.save(entity).then(updatedResponse);
}

function updatedResponse(): ILocalResponse {
  return {
    body: {
      apiVersion: apiVersion(),
      data: {
        status: 'ok',
      },
    },
    code: HttpCodes.OK,
  };
}

function notFoundResponse(request: Request): ILocalResponse {
  const message = `No endpoint named ${request.body.endpoint}`;
  const errorInstance = createInstanceError(DOMAIN, `No endpoint named ${request.body.endpoint}`, 'Not Found');
  const errorBody = createErrorBody(HttpCodes.NOT_FOUND, message, [errorInstance]);
  return createErrorResponse(HttpCodes.NOT_FOUND, errorBody);
}
