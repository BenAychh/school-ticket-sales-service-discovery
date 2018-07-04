import * as Datastore from '@google-cloud/datastore';
import { QueryInfo } from '@google-cloud/datastore/query';
import * as HttpCodes from 'http-status-codes';
import { DateTime } from 'luxon';
import * as timeAgo from 'node-time-ago';
import { assocPath, head, merge } from 'ramda';
import { IClientEndpoint, IClientEndpoints } from '../../interfaces/ClientEndpoint';
import { IEndpoint } from '../../interfaces/Endpoint';
import { ILocalResponse } from '../../interfaces/LocalResponse';
import { ENDPOINT } from '../constants';
import { apiVersion } from '../helpers/apiVersion';

interface IGlobalAny {
  clientEndpoints: IClientEndpointsResponse;
}

interface IClientEndpointsResponse {
  lastUpdated: {
    friendly?: string;
    utc: Date;
  };
  endpoints: IClientEndpoints;
}

export async function getEndpointsHandler(datastore: Datastore): Promise<ILocalResponse> {
  return getEndpointsFromGlobalOrDb(datastore)
  .then((endpoints) => {
    const endpointsWithUpdatedTimeAgo =
      assocPath(['lastUpdated', 'friendly'], timeAgo(endpoints.lastUpdated.utc), endpoints);
    return {
      body: {
        apiVersion: apiVersion(),
        data: endpointsWithUpdatedTimeAgo,
      },
      code: HttpCodes.OK,
    };
  });
}

function getEndpointsFromGlobalOrDb(datastore: Datastore): Promise<IClientEndpointsResponse> {
  const endpointsOrNull = getGlobalEndpointsIfTheyExist();
  if (endpointsOrNull) {
    return Promise.resolve(endpointsOrNull);
  }
  return getClientEndpointsFromDb(datastore);
}

function getGlobalEndpointsIfTheyExist(): IClientEndpointsResponse | null {
  const globalAny = global as any as IGlobalAny;
  if (globalAny.clientEndpoints) {
    const now = DateTime.utc();
    const lastUpdated = DateTime.fromJSDate(globalAny.clientEndpoints.lastUpdated.utc);
    const diffInSeconds = now.diff(lastUpdated, 'seconds');
    if (diffInSeconds.seconds < 300) {
      return globalAny.clientEndpoints;
    }
  }
  return null;
}

async function getClientEndpointsFromDb(datastore: Datastore) {
  const globalAny = global as any as IGlobalAny;
  const getAllEndpoints = datastore.createQuery(ENDPOINT.NAMESPACE, ENDPOINT.KIND);
  const results = await datastore.runQuery(getAllEndpoints) as [IEndpoint[], QueryInfo];
  const endpoints = endpointReducer(results);
  const utc = DateTime.utc().toJSDate();
  globalAny.clientEndpoints = {
    endpoints,
    lastUpdated: {
      utc,
    },
  };
  return globalAny.clientEndpoints;
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
