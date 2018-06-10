import * as Datastore from '@google-cloud/datastore';
import * as bcrypt from 'bcrypt';
import { Request } from 'express-serve-static-core';
import * as HttpCodes from 'http-status-codes';
import { ILocalResponse } from '../interfaces/LocalResponse';
import { apiVersion } from './apiVersion';
import { isPasswordValid } from './isPasswordValid';

const PROJECT_ID = 'school-ticket-sales';
const NAMESPACE = 'test-school';
const KIND = 'Student';

const datastore = new Datastore({
  projectId: PROJECT_ID,
});

export async function create(request: Request): Promise<ILocalResponse> {
  if (await isPasswordValid(datastore, request)) {
    return {
      body: {
        apiVersion: apiVersion(),
        data: {
          message: 'created',
        },
      },
      code: HttpCodes.CREATED,
    };
  }
  return {
    body: {
      apiVersion: apiVersion(),
      error: {
        code: HttpCodes.UNAUTHORIZED,
        errors: [{
          domain: 'some domain',
          message: 'This user is not authorized',
          reason: 'This user is not authorized',
        }],
        message: 'This user is not authorized',
      },
    },
    code: HttpCodes.UNAUTHORIZED,
  };
}
