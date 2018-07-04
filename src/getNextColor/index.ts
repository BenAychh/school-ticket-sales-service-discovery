import * as Datastore from '@google-cloud/datastore';
import { Request } from 'express-serve-static-core';
import * as HttpCodes from 'http-status-codes';
import { IEndpoint } from '../../interfaces/Endpoint';
import { ILocalResponse } from '../../interfaces/LocalResponse';
import { ENDPOINT } from '../constants';
import { apiVersion } from '../helpers/apiVersion';

interface INextColorInfo {
  isNew: boolean;
  nextColor: 'blue' | 'green';
}

export async function getNextColorHandler(datastore: Datastore, request: Request): Promise<ILocalResponse> {
  const key = datastore.key({
    namespace: 'deployments',
    path: [ENDPOINT.KIND, request.query.name],
  });

  return datastore.get(key)
  .then(getColor)
  .then(createILocalResponse);
}

function getColor([result]: [IEndpoint]): INextColorInfo {
  if (!result) {
    return handleNullResult();
  }
  return handleExistingColor(result);
}

function handleNullResult(): INextColorInfo {
  return {
    isNew: true,
    nextColor: 'blue',
  };
}

function handleExistingColor(result: IEndpoint): INextColorInfo {
  let nextColor: 'blue' | 'green' = 'blue';
  if (result.color === 'blue') {
    nextColor = 'green';
  }
  return {
    isNew: false,
    nextColor,
  };
}

function createILocalResponse(nextColorInfo: INextColorInfo): ILocalResponse {
  return {
    body: {
      apiVersion: apiVersion(),
      data: nextColorInfo,
    },
    code: HttpCodes.OK,
  };
}
