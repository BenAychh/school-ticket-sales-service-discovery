import * as Datastore from '@google-cloud/datastore';
import { Request, Response } from 'express';
import { createEndpointHandler } from './src/createEndpoint/index';
import { flipEndpointHandler } from './src/flipEndpoint/index';
import { getEndpointsHandler } from './src/getEndpoints/index';
import { getNextColorHandler } from './src/getNextColor/index';
import { handleErrors } from './src/helpers/handleErrors';
import { requireAuthorization } from './src/helpers/requireAuthorization';

const PROJECT_ID = 'school-ticket-sales';

const datastore = new Datastore({
  projectId: PROJECT_ID,
});

export async function createEndpoint(request: Request, response: Response) {
  try {
    await requireAuthorization(datastore, request);
    const localResponse = await createEndpointHandler(datastore, request);
    response.status(localResponse.code).json(localResponse.body);
  } catch (error) {
    const localResponse = handleErrors('createEndpoint', error);
    response.status(localResponse.code).json(localResponse.body);
  }
}

export async function flipEndpoint(request: Request, response: Response) {
  try {
    await requireAuthorization(datastore, request);
    const localResponse = await flipEndpointHandler(datastore, request);
    response.status(localResponse.code).json(localResponse.body);
  } catch (error) {
    const localResponse = handleErrors('flipEndpoint', error);
    response.status(localResponse.code).json(localResponse.body);
  }
}

export async function getEndpoints(_: Request, response: Response) {
  try {
    const localResponse = await getEndpointsHandler(datastore);
    response.status(localResponse.code).json(localResponse.body);
  } catch (error) {
    const localResponse = handleErrors('getEndpoints', error);
    response.status(localResponse.code).json(localResponse.body);
  }
}

export async function getNextColor(request: Request, response: Response) {
  try {
    const localResponse = await getNextColorHandler(datastore, request);
    response.status(localResponse.code).json(localResponse.body);
  } catch (error) {
    const localResponse = handleErrors('getNextColor', error);
    response.status(localResponse.code).json(localResponse.body);
  }
}
