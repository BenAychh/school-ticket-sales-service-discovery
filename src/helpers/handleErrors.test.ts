import * as HttpCodes from 'http-status-codes';
import { ValidationError } from 'joi';
import { handleErrors } from './handleErrors';
import { logger } from './logging';

describe('handleErrors', () => {
  beforeAll(() => {
    logger.silent = true;
  });

  afterAll(() => {
    logger.silent = false;
  });

  it('logs unhandled errors', () => {
    const spy = spyOn(logger, 'error');
    const error = new Error('An error');
    handleErrors('Domain', error);
    expect(spy).toHaveBeenCalledWith(error);
  });

  it('can handle generic errors', () => {
    expect(handleErrors('Domain', new Error('An error'))).toMatchObject({
      body: {
        apiVersion: expect.any(String),
        error: {
          code: HttpCodes.INTERNAL_SERVER_ERROR,
          errors: [{
            domain: 'Unhandled Error in Domain',
            message: 'An error',
            reason: 'Error',
          }],
          message: 'An error',
        },
      },
      code: HttpCodes.INTERNAL_SERVER_ERROR,
    });
  });

  it('can handle Authorization Errors', () => {
    const authorizationError = new Error('Authorization Message');
    authorizationError.name = 'AuthorizationError';
    expect(handleErrors('Domain', authorizationError)).toMatchObject({
      body: {
        apiVersion: expect.any(String),
        error: {
          code: HttpCodes.UNAUTHORIZED,
          errors: [{
            domain: 'Domain',
            message: 'Authorization Message',
            reason: 'AuthorizationError',
          }],
          message: 'Authorization Message',
        },
      },
      code: HttpCodes.UNAUTHORIZED,
    });
  });

  it('can handle Conflict Errors', () => {
    const conflictError = new Error('Conflict Message');
    conflictError.name = 'ConflictError';
    expect(handleErrors('Domain', conflictError)).toMatchObject({
      body: {
        apiVersion: expect.any(String),
        error: {
          code: HttpCodes.CONFLICT,
          errors: [{
            domain: 'Domain',
            message: 'Conflict Message',
            reason: 'ConflictError',
          }],
          message: 'Conflict Message',
        },
      },
      code: HttpCodes.CONFLICT,
    });
  });

  it('can handle NotFound Errors', () => {
    const notFoundError = new Error('NotFound Message');
    notFoundError.name = 'NotFoundError';
    expect(handleErrors('Domain', notFoundError)).toMatchObject({
      body: {
        apiVersion: expect.any(String),
        error: {
          code: HttpCodes.NOT_FOUND,
          errors: [{
            domain: 'Domain',
            message: 'NotFound Message',
            reason: 'NotFoundError',
          }],
          message: 'NotFound Message',
        },
      },
      code: HttpCodes.NOT_FOUND,
    });
  });

  it('can handle ValidationError Errors', () => {
    const validationError = new Error('Validation Message') as ValidationError;
    validationError.details = [{
      message: 'Validation Message',
      path: ['some', 'path'],
      type: 'ValidationError',
    }];
    validationError.name = 'ValidationError';
    expect(handleErrors('Domain', validationError)).toMatchObject({
      body: {
        apiVersion: expect.any(String),
        error: {
          code: HttpCodes.BAD_REQUEST,
          errors: [{
            domain: 'Domain',
            message: 'Validation Message',
            reason: 'ValidationError',
          }],
          message: 'Validation Message',
        },
      },
      code: HttpCodes.BAD_REQUEST,
    });
  });
});
