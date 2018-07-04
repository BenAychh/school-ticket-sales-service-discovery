import * as HttpCodes from 'http-status-codes';
import { merge, omit } from 'ramda';
import { ENDPOINT } from '../constants';
import { createEndpointHandler } from './';

describe('createEndpointHandler', () => {
  function payload(modifiers?: object, omitted: string[] = []): any {
    return {
      body: omit(omitted, merge({
        color: 'blue',
        duration: 3600,
        name: 'amazingEndpoint',
        urls: {
          blue: 'https://blue',
          green: 'https://green',
        },
      }, modifiers)),
    };
  }

  function datastoreSpy() {
    return {
      key: jasmine.createSpy('key'),
      save: jasmine.createSpy('save').and.returnValue(Promise.resolve()),
    };
  }

  test('sanity check - payload() is valid', () => {
    return expect(createEndpointHandler(datastoreSpy() as any, payload())).resolves.toBeTruthy();
  });

  describe('validation', () => {
    describe('color must be blue or green', () => {
      test('it allows the color blue', () => {
        return expect(createEndpointHandler(datastoreSpy() as any, payload({ color: 'blue' }))).resolves.toBeTruthy();
      });

      test('it allows the color green', () => {
        return expect(createEndpointHandler(datastoreSpy() as any, payload({ color: 'green' }))).resolves.toBeTruthy();
      });

      test('it does not allow any other color', () => {
        return expect(createEndpointHandler(datastoreSpy() as any, payload({ color: 'red' }))).rejects.toMatchObject({
          message: 'child "color" fails because ["color" must be one of [blue, green]]',
        });
      });
    });

    describe('duration', () => {
      test('duration must be present', () => {
        return expect(createEndpointHandler(datastoreSpy() as any, payload({}, ['duration']))).rejects.toMatchObject({
          message: 'child "duration" fails because ["duration" is required]',
        });
      });

      test('duration must be a number', () => {
        return expect(createEndpointHandler(datastoreSpy() as any, payload({ duration: 'hello' })))
        .rejects.toMatchObject({
          message: 'child "duration" fails because ["duration" must be a number]',
        });
      });
    });

    describe('name', () => {
      test('name must be present', () => {
        return expect(createEndpointHandler(datastoreSpy() as any, payload({ }, ['name']))).rejects.toMatchObject({
          message: 'child "name" fails because ["name" is required]',
        });
      });

      test('name must be a string', () => {
        return expect(createEndpointHandler(datastoreSpy() as any, payload({ name: 1234 }))).rejects.toMatchObject({
          message: 'child "name" fails because ["name" must be a string]',
        });
      });
    });

    describe('urls', () => {

      function urls(modifiers?: object, omitted: string[] = []): any {
        return {
          urls: omit(omitted, merge({
            blue: 'https://blue',
            green: 'https://green',
          }, modifiers)),
        };
      }
      test('urls must be present', () => {
        return expect(createEndpointHandler(datastoreSpy() as any, payload({ }, ['urls']))).rejects.toMatchObject({
          message: 'child "urls" fails because ["urls" is required]',
        });
      });

      test('blue url must be present', () => {
        return expect(createEndpointHandler(datastoreSpy() as any, payload(urls({}, ['blue'])))).rejects.toMatchObject({
          message: 'child "urls" fails because [child "blue" fails because ["blue" is required]]',
        });
      });

      test('blue url must be a string', () => {
        return expect(createEndpointHandler(datastoreSpy() as any, payload(urls({ blue: 1234 }))))
        .rejects.toMatchObject({
          message: 'child "urls" fails because [child "blue" fails because ["blue" must be a string]]',
        });
      });

      test('green url must be present', () => {
        return expect(createEndpointHandler(datastoreSpy() as any, payload(urls({}, ['green']))))
        .rejects.toMatchObject({
          message: 'child "urls" fails because [child "green" fails because ["green" is required]]',
        });
      });

      test('green url must be a string', () => {
        return expect(createEndpointHandler(datastoreSpy() as any, payload(urls({ green: 1234 }))))
        .rejects.toMatchObject({
          message: 'child "urls" fails because [child "green" fails because ["green" must be a string]]',
        });
      });

      test('it does not allow any other color url', () => {
        return expect(createEndpointHandler(datastoreSpy() as any, payload(urls({ red: 'https://red' }))))
        .rejects.toMatchObject({
          message: 'child "urls" fails because ["red" is not allowed]',
        });
      });
    });

  });

  describe('saving the endpoint', () => {
    test('it creates the correct key', async () => {
      const datastore = datastoreSpy() as any;
      await createEndpointHandler(datastore, payload());
      expect(datastore.key as jasmine.Spy).toHaveBeenCalledWith({
        namespace: 'deployments',
        path: [ENDPOINT.KIND, 'amazingEndpoint'],
      });
    });

    test('it creates the correct data object', async () => {
      const datastore = datastoreSpy();
      await createEndpointHandler(datastore as any, payload());
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
  });

  test('returns the correct value', () => {
    return expect(createEndpointHandler(datastoreSpy() as any, payload())).resolves.toMatchObject({
      body: {
        apiVersion: expect.any(String),
        data: {
          color: 'blue',
          duration: 3600,
          updatedAt: expect.any(Date),
          urls: {
            blue: 'https://blue',
            green: 'https://green',
          },
        },
      },
      code: HttpCodes.CREATED,
    });
  });
});
