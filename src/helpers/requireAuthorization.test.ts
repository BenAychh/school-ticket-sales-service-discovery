import * as bcrypt from 'bcrypt';
import { AuthorizationError } from '../errors/AuthorizationError';
import { logger } from './logging';
import { requireAuthorization } from './requireAuthorization';

describe('requireAuthorization', () => {
  function gotUser(password = 'pa$5w0rd') {
    return {
      password: bcrypt.hashSync(password, 5),
    };
  }

  function datastoreSpy() {
    return {
      get: jasmine.createSpy('get').and.returnValue(Promise.resolve([gotUser()])),
      key: jasmine.createSpy('key'),
    };
  }

  function createRequest({ username, password} = { username: 'tester', password: 'pa$5w0rd' }) {
    return {
      headers: {
        authorization: `Basic ${new Buffer(`${username}:${password}`).toString('base64')}`,
      },
    };
  }

  function expectedAuthorizationError() {
    return new AuthorizationError('Invalid username or password');
  }

  beforeAll(() => {
    logger.silent = true;
  });

  afterAll(() => {
    logger.silent = false;
  });

  test('does not throw an error if the username and password are correct', () => {
    return expect(requireAuthorization(datastoreSpy() as any, createRequest() as any)).resolves.toBeUndefined();
  });

  test('throws an error if the authorization headers are not there', () => {
    return expect(requireAuthorization(datastoreSpy() as any, { headers: {} } as any))
      .rejects.toMatchObject(expectedAuthorizationError());
  });

  test('throws an error if the user is not in the database', () => {
    const datastore = datastoreSpy();
    datastore.get.and.returnValue(Promise.resolve(null));
    return expect(requireAuthorization(datastore as any, createRequest() as any))
      .rejects.toMatchObject(expectedAuthorizationError());
  });

  test('throws an error if the password does not match', () => {
    return expect(requireAuthorization(
      datastoreSpy() as any,
      createRequest({ username: 'N/A', password: 'wrong' }) as any,
    )).rejects.toMatchObject(expectedAuthorizationError());
  });

  test('throws an error if the db cannot connect', () => {
    const datastore = datastoreSpy();
    datastore.get.and.returnValue(Promise.reject(new Error('random')));
    return expect(requireAuthorization(datastore as any, createRequest() as any))
      .rejects.toMatchObject(expectedAuthorizationError());
  });
});
