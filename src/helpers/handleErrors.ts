import * as HttpCodes from 'http-status-codes';
import { ValidationError } from 'joi';
import { IInstanceError, ILocalResponse } from '../../interfaces/LocalResponse';
import { createErrorBody, createErrorResponse, createInstanceError } from '../responses/errorResponse';
import { logger } from './logging';

type errorHandlingFunction = (domain: string, error: Error) => ILocalResponse;
const errorHandlersBase: { [key: string]: errorHandlingFunction } = {
  AuthorizationError: handleAuthorizationError,
  ConflictError: handleConflictError,
  NotFoundError: handleNotFoundError,
  ValidationError: handleValidationErrors,
};
const errorHandlers: { [key: string]: errorHandlingFunction } = new Proxy(errorHandlersBase, {
  get(obj, prop) {
    return prop in obj ?
        obj[prop as string] :
        genericErrorHandler;
  },
});

export function handleErrors(domain: string, error: Error): ILocalResponse {
  return errorHandlers[error.name](domain, error);
}

function genericErrorHandler(domain: string, error: Error): ILocalResponse {
  logger.error(error);
  const errorInstances = [createInstanceError(`Unhandled Error in ${domain}`, error.message, error.name)];
  return errorBodyAssembler(HttpCodes.INTERNAL_SERVER_ERROR, error.message, errorInstances);
}

function handleAuthorizationError(domain: string, error: Error): ILocalResponse {
  const errorInstances = [createInstanceError(domain, error.message, error.name)];
  return errorBodyAssembler(HttpCodes.UNAUTHORIZED, error.message, errorInstances);
}

function handleValidationErrors(domain: string, error: ValidationError): ILocalResponse {
  const errorInstances = error.details.map((details) => createInstanceError(domain, details.message, details.type));
  return errorBodyAssembler(HttpCodes.BAD_REQUEST, error.message, errorInstances);
}

function handleNotFoundError(domain: string, error: Error): ILocalResponse {
  const errorInstances = [createInstanceError(domain, error.message, error.name)];
  return errorBodyAssembler(HttpCodes.NOT_FOUND, error.message, errorInstances);
}

function handleConflictError(domain: string, error: Error): ILocalResponse {
  const errorInstances = [createInstanceError(domain, error.message, error.name)];
  return errorBodyAssembler(HttpCodes.CONFLICT, error.message, errorInstances);
}

function errorBodyAssembler(code: number, message: string, errorInstances: IInstanceError[]): ILocalResponse {
  const errorBody = createErrorBody(code, message, errorInstances);
  return createErrorResponse(code, errorBody);
}
