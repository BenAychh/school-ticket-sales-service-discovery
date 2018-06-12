import * as Datastore from '@google-cloud/datastore';
import { Request } from 'express-serve-static-core';
import * as HttpCodes from 'http-status-codes';
import { DateTime } from 'luxon';
import { head, merge } from 'ramda';
import { IClientEndpoint, IClientEndpoints } from '../../interfaces/ClientEndpoint';
import { IEndpoint } from '../../interfaces/Endpoint';
import { ILocalResponse } from '../../interfaces/LocalResponse';
import { ENDPOINT } from '../constants';
import { apiVersion } from '../helpers/apiVersion';

const NAMESPACE = (environment: string = 'prod') => `${environment}-deployments`;

export async function getEndpointsHandler(datastore: Datastore, request: Request): Promise<ILocalResponse> {
  const getAllEndpoints = datastore.createQuery(NAMESPACE(request.query.environment), ENDPOINT.KIND);

  return datastore.runQuery(getAllEndpoints)
  .then(([results]) => {
    return results.reduce((endpoints: IClientEndpoints, result: IEndpoint) => {
      const key = result[Datastore.KEY].name;
      return merge(endpoints, { [key]: getClientEndpoint(result) });
    }, {} as IClientEndpoints);
  })
  .then((endpoints) => {
    return {
      body: {
        apiVersion: apiVersion(),
        data: endpoints,
      },
      code: HttpCodes.OK,
    };
  });
}

function getClientEndpoint(endpoint: IEndpoint): IClientEndpoint {
  const freshest = { freshest: endpoint.urls[endpoint.color] };
  return merge(freshest, calculateUrlToSend(endpoint));
}

function calculateUrlToSend(endpoint: IEndpoint): { url: string } {
  const startTime = DateTime.fromJSDate(endpoint.updatedAt);
  const secondsSinceStartTime = DateTime.utc().diff(startTime, 'seconds').seconds;
  const fractionalElapsedTime = secondsSinceStartTime / endpoint.duration;
  if (Math.random() <=  fractionalElapsedTime) {
    return { url: endpoint.urls[endpoint.color]};
  }
  return { url: getOldUrl(endpoint) };
}

function getOldUrl(endpoint: IEndpoint): string {
  const colors = Reflect.ownKeys(endpoint.urls);
  const oldColor = head(colors.filter((color) => color !== endpoint.color));
  return endpoint.urls[oldColor];
}
