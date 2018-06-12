import * as HttpCodes from 'http-status-codes';
import { ILocalResponse } from '../../interfaces/LocalResponse';
import { createErrorBody, createErrorResponse, createInstanceError } from './errorResponse';

export const unathorizedResponse: (domain: string) => ILocalResponse = (domain: string) => {
  const MESSAGE = 'This user is not authorized';
  const REASON = 'unauthorized';
  const instanceErrors = [createInstanceError(domain, MESSAGE, REASON)];
  return createErrorResponse(HttpCodes.UNAUTHORIZED, createErrorBody(HttpCodes.UNAUTHORIZED, MESSAGE, instanceErrors));
};
