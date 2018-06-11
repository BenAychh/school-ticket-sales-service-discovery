import { curry } from 'ramda';
import { IErrorBody, IInstanceError, ILocalResponse } from '../../interfaces/LocalResponse';
import { apiVersion } from '../helpers/apiVersion';

export function createErrorResponse(code: number, error: IErrorBody): ILocalResponse {
  return {
    body: {
      apiVersion: apiVersion(),
      error,
    },
    code,
  };
}

export function createErrorBody(code: number, message: string, errors: IInstanceError[]): IErrorBody {
  return {
    code,
    errors,
    message,
  };
}

export function createInstanceError(domain: string, message: string, reason: string): IInstanceError {
  return {
    domain,
    message,
    reason,
  };
}
