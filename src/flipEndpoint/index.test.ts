import * as Datastore from '@google-cloud/datastore';
import * as HttpCodes from 'http-status-codes';
import { DateTime } from 'luxon';
import { merge, omit } from 'ramda';
import { ENDPOINT } from '../constants';
import { flipEndpointHandler } from './';

describe('flipEndpointHandler', () => {
  function payload(modifiers?: object, omitted: string[] = []): any {
    return {
      body: omit(omitted, merge({
        color: 'blue',
        duration: 3600,
        environment: 'staging',
        name: 'amazingEndpoint',
      }, modifiers)),
    };
  }

  function validGetResponse() {
    return {
      color: 'green',
      duration: 3600,
      updatedAt: new Date(),
      urls: {
        blue: 'https://blue',
        green: 'https://green',
      },
    };
  }

  function datastoreSpy(getModifiers: object = {}) {
    return {
      get: jasmine.createSpy('get').and.returnValue(Promise.resolve([merge(validGetResponse(), getModifiers)])),
      key: jasmine.createSpy('key'),
      save: jasmine.createSpy('save').and.returnValue(Promise.resolve()),
    };
  }

  it('sanity check - payload() is valid', () => {
    return expect(flipEndpointHandler(datastoreSpy() as any, payload())).resolves.toBeTruthy();
  });

  describe('validation', () => {
    describe('color must be blue or green', () => {
      test('it allows the color blue', () => {
        return expect(flipEndpointHandler(datastoreSpy() as any, payload({ color: 'blue' }))).resolves.toBeTruthy();
      });

      test('it allows the color green', () => {
        return expect(flipEndpointHandler(datastoreSpy({ color: 'blue' }) as any, payload({ color: 'green' })))
        .resolves.toBeTruthy();
      });

      test('it does not allow any other color', () => {
          return expect(flipEndpointHandler(datastoreSpy() as any, payload({ color: 'red' })))
          .rejects.toMatchObject({
            message: 'child "color" fails because ["color" must be one of [blue, green]]',
          });
        });
    });

    describe('duration', () => {
      test('duration must be present', () => {
        return expect(flipEndpointHandler(datastoreSpy() as any, payload({}, ['duration']))).rejects.toMatchObject({
          message: 'child "duration" fails because ["duration" is required]',
        });
      });

      test('duration must be a number', () => {
        return expect(flipEndpointHandler(datastoreSpy() as any, payload({ duration: 'hello' })))
        .rejects.toMatchObject({
          message: 'child "duration" fails because ["duration" must be a number]',
        });
      });
    });

    describe('environment', () => {
      test('it allows the environment staging', () => {
        return expect(flipEndpointHandler(datastoreSpy() as any, payload({ environment: 'staging' })))
        .resolves.toBeTruthy();
      });

      test('it allows the environment prod', () => {
        return expect(flipEndpointHandler(datastoreSpy() as any, payload({ environment: 'prod' })))
        .resolves.toBeTruthy();
      });

      test('it does not allow any other environment', () => {
        return expect(flipEndpointHandler(datastoreSpy() as any, payload({ environment: 'dev' })))
        .rejects.toMatchObject({
          message: 'child "environment" fails because ["environment" must be one of [staging, prod]]',
        });
      });
    });

    describe('name', () => {
      test('name must be present', () => {
        return expect(flipEndpointHandler(datastoreSpy() as any, payload({ }, ['name']))).rejects.toMatchObject({
          message: 'child "name" fails because ["name" is required]',
        });
      });

      test('name must be a string', () => {
        return expect(flipEndpointHandler(datastoreSpy() as any, payload({ name: 1234 }))).rejects.toMatchObject({
          message: 'child "name" fails because ["name" must be a string]',
        });
      });
    });
  });

  describe('updating the endpoint', () => {

    test('it creates the correct key', async () => {
      const datastore = datastoreSpy() as any;
      await flipEndpointHandler(datastore, payload());
      expect(datastore.key as jasmine.Spy).toHaveBeenCalledWith({
        namespace: 'staging-deployments',
        path: [ENDPOINT.KIND, 'amazingEndpoint'],
      });
    });
    test('fails if the Endpoint cannot be found', () => {
      const datastore = datastoreSpy();
      datastore.get.and.returnValue(Promise.resolve([null]));
      return expect(flipEndpointHandler(datastore as any, payload())).rejects.toMatchObject({
        message: 'No endpoint named amazingEndpoint',
      });
    });

    test('fails if the color has already been flipped', () => {
      return expect(flipEndpointHandler(datastoreSpy() as any, payload({ color: 'green' }))).rejects.toMatchObject({
        message: 'Color on amazingEndpoint in staging is already green',
      });
    });

    test('it creates the correct data object', async () => {
      const datastore = datastoreSpy();
      await flipEndpointHandler(datastore as any, payload());
      expect(datastore.save.calls.first().args[0].data).toEqual({
        color: 'blue',
        duration: 3600,
        updatedAt: expect.any(Date),
        urls: {
          blue: 'https://blue',
          green: 'https://green',
        },
      });
    });

    test('it updates the updatedAt field', async () => {
      const date = DateTime.utc();
      const datastore = datastoreSpy({ updatedAt: date.toJSDate() });
      await new Promise((resolve) => setTimeout(resolve, 10));
      await flipEndpointHandler(datastore as any, payload());
      const returnedDate = DateTime.fromJSDate(datastore.save.calls.first().args[0].data.updatedAt);
      expect(returnedDate > date).toBe(true);
    });
  });

  test('returns the correct value', () => {
    return expect(flipEndpointHandler(datastoreSpy() as any, payload())).resolves.toMatchObject({
      body: {
        apiVersion: expect.any(String),
        data: {
          color: 'blue',
          duration: 3600,
          updatedAt: expect.any(Date),
        },
      },
      code: HttpCodes.OK,
    });
  });
});
