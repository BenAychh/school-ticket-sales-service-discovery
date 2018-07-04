import * as Datastore from '@google-cloud/datastore';
import { QueryInfo } from '@google-cloud/datastore/query';
import * as HttpCodes from 'http-status-codes';
import { DateTime } from 'luxon';
import { head, merge } from 'ramda';
import { IClientEndpoint, IClientEndpoints } from '../../interfaces/ClientEndpoint';
import { IEndpoint } from '../../interfaces/Endpoint';
import { ILocalResponse } from '../../interfaces/LocalResponse';
import { ENDPOINT } from '../constants';
import { apiVersion } from '../helpers/apiVersion';

interface IGlobalAny {
  clientEndpoints: {
    lastUpdated: Date;
    endpoints: IClientEndpoints;
  };
}

export async function getEndpointsHandler(datastore: Datastore): Promise<ILocalResponse> {
  return getEndpointsIfNotInGlobal(datastore)
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

function getEndpointsIfNotInGlobal(datastore: Datastore): Promise<IClientEndpoints> {
  const endpointsOrNull = getGlobalEndpointsIfTheyExist();
  if (endpointsOrNull) {
    return Promise.resolve(endpointsOrNull);
  }
  return getClientEndpointsFromDb(datastore);
}

function getGlobalEndpointsIfTheyExist(): IClientEndpoints | null {
  const globalAny = global as any as IGlobalAny;
  if (globalAny.clientEndpoints) {
    const now = DateTime.utc();
    const lastUpdated = DateTime.fromJSDate(globalAny.clientEndpoints.lastUpdated);
    const diffInSeconds = now.diff(lastUpdated, 'seconds');
    if (diffInSeconds.seconds < 300) {
      return globalAny.clientEndpoints.endpoints;
    }
  }
  return null;
}

async function getClientEndpointsFromDb(datastore: Datastore) {
  const globalAny = global as any as IGlobalAny;
  const getAllEndpoints = datastore.createQuery('prod-deployments', ENDPOINT.KIND);
  const results = await datastore.runQuery(getAllEndpoints) as [IEndpoint[], QueryInfo];
  const endpoints = endpointReducer(results);
  globalAny.clientEndpoints = {
    endpoints,
    lastUpdated: DateTime.utc().toJSDate(),
  };
  return endpoints;
}

function endpointReducer([results]: [IEndpoint[], QueryInfo]): IClientEndpoints {
  return results.reduce((endpoints: IClientEndpoints, result: IEndpoint) => {
    const key = result[Datastore.KEY].name;
    return merge(endpoints, { [key]: getClientEndpoint(result) });
  }, {} as IClientEndpoints);
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
