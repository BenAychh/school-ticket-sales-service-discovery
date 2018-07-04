import * as Datastore from '@google-cloud/datastore';
import { DateTime } from 'luxon';
import { IClientEndpoints } from '../../interfaces/ClientEndpoint';
import { getEndpointsHandler } from './';

interface IGlobalAny {
  clientEndpoints: {
    lastUpdated: Date;
    endpoints: IClientEndpoints;
  };
}

const globalAny = global as any as IGlobalAny;

describe('getEndpointsHandler', () => {
  function queryResults() {
    return [
      [
        { // Should return blue.
          color: 'blue',
          duration: 3600,
          updatedAt: DateTime.fromISO('2018-06-12T08:00:00.000Z').toJSDate(),
          urls: {
            blue: 'https://blueGetEvents',
            green: 'https://greenGetEvents',
          },
          [Datastore.KEY]: {
            name: 'getEvents',
          },
        },
        { // Should return blue.
          color: 'blue',
          duration: 3600,
          updatedAt: DateTime.fromISO('2018-06-12T08:15:00.000Z').toJSDate(),
          urls: {
            blue: 'https://blueUpdateEvents',
            green: 'https://greenUpdateEvents',
          },
          [Datastore.KEY]: {
            name: 'updateEvents',
          },
        },
        { // Should return green
          color: 'blue',
          duration: 3600,
          updatedAt: DateTime.fromISO('2018-06-12T08:30:00.000Z').toJSDate(),
          urls: {
            blue: 'https://blueCreateEvent',
            green: 'https://greenCreateEvent',
          },
          [Datastore.KEY]: {
            name: 'createEvent',
          },
        },
        { // Should return green
          color: 'green',
          duration: 3600,
          updatedAt: DateTime.fromISO('2018-06-12T07:00:00.000Z').toJSDate(),
          urls: {
            blue: 'https://blueGetStudents',
            green: 'https://greenGetStudents',
          },
          [Datastore.KEY]: {
            name: 'getStudents',
          },
        },
        { // Should return green
          color: 'green',
          duration: 0,
          updatedAt: DateTime.fromISO('2018-06-12T07:00:00.000Z').toJSDate(),
          urls: {
            blue: 'https://blueCreateStudent',
            green: 'https://greenCreateStudent',
          },
          [Datastore.KEY]: {
            name: 'createStudent',
          },
        },
      ],
    ];
  }

  function datastoreSpy() {
    return {
      createQuery: jasmine.createSpy('createQuery'),
      runQuery: jasmine.createSpy('runQuery').and.returnValue(Promise.resolve(queryResults())),
    };
  }

  beforeEach(() => {
    spyOn(DateTime, 'utc').and.returnValue(DateTime.fromISO('2018-06-12T08:45:00.000Z'));
    spyOn(Math, 'random').and.returnValue(0.50);
  });

  afterEach(() => {
    (global as any).clientEndpoints = undefined;
  });

  test('sanity check, default values resolve', () => {
    return expect(getEndpointsHandler(datastoreSpy() as any)).resolves.toBeTruthy();
  });

  describe('uses the global variable if applicable', () => {
    test('uses the global variable if it was updated less than 300 seconds ago', async () => {
      globalAny.clientEndpoints = {
        endpoints: {
          storedEndpoint1: {
            freshest: 'http://storedEndpoint1',
            url: 'https://storeEndpoint1Older',
          },
          storedEndpoint2: {
            freshest: 'http://storedEndpoint2',
            url: 'https://storeEndpoint2Older',
          },
        },
        lastUpdated: DateTime.utc().minus({ seconds: 30 }).toJSDate(),
      };

      const endpoints = await getEndpointsHandler(datastoreSpy() as any);
      expect(endpoints.body.data).toEqual({
        storedEndpoint1: {
          freshest: 'http://storedEndpoint1',
          url: 'https://storeEndpoint1Older',
        },
        storedEndpoint2: {
          freshest: 'http://storedEndpoint2',
          url: 'https://storeEndpoint2Older',
        },
      });
    });

    test('does not use global variable if it was updated more than 300 seconds ago', async () => {
      globalAny.clientEndpoints = {
        endpoints: {
          storedEndpoint1: {
            freshest: 'http://storedEndpoint1',
            url: 'https://storeEndpoint1Older',
          },
          storedEndpoint2: {
            freshest: 'http://storedEndpoint2',
            url: 'https://storeEndpoint2Older',
          },
        },
        lastUpdated: DateTime.utc().minus({ seconds: 301 }).toJSDate(),
      };

      const endpoints = await getEndpointsHandler(datastoreSpy() as any);
      expect(endpoints.body.data.storedEndpoint1).toBeUndefined();
    });

    test('updates the global variable if it needs to be updated', async () => {
      globalAny.clientEndpoints = {
        endpoints: {
          storedEndpoint1: {
            freshest: 'http://storedEndpoint1',
            url: 'https://storeEndpoint1Older',
          },
          storedEndpoint2: {
            freshest: 'http://storedEndpoint2',
            url: 'https://storeEndpoint2Older',
          },
        },
        lastUpdated: DateTime.utc().minus({ seconds: 301 }).toJSDate(),
      };

      await getEndpointsHandler(datastoreSpy() as any);
      expect((global as any).clientEndpoints.endpoints.getEvents).toBeTruthy();
    });
  });

  test('defaults to the prod namespace', async () => {
    const datastore = datastoreSpy();
    await getEndpointsHandler(datastore as any);
    expect(datastore.createQuery.calls.first().args[0]).toEqual('prod-deployments');
  });

  test('it returns the new color when the timeelapsed/duration is greater than Math.random()', async () => {
    const result = await getEndpointsHandler(datastoreSpy() as any);
    expect(result.body.data.getEvents).toEqual({
      freshest: 'https://blueGetEvents',
      url: 'https://blueGetEvents',
    });
  });

  test('it returns the new color when the timeelapsed/duration is equal to Math.random()', async () => {
    const result = await getEndpointsHandler(datastoreSpy() as any);
    expect(result.body.data.updateEvents).toEqual({
      freshest: 'https://blueUpdateEvents',
      url: 'https://blueUpdateEvents',
    });
  });

  test('it returns the old color when the timeelapsed/duration is less than Math.random()', async () => {
    const result = await getEndpointsHandler(datastoreSpy() as any);
    expect(result.body.data.createEvent).toEqual({
      freshest: 'https://blueCreateEvent',
      url: 'https://greenCreateEvent',
    });
  });

  test('it returns the new color when the timeelapsed/duration is greater than 1', async () => {
    const result = await getEndpointsHandler(datastoreSpy() as any);
    expect(result.body.data.getStudents).toEqual({
      freshest: 'https://greenGetStudents',
      url: 'https://greenGetStudents',
    });
  });

  test('it returns the new color when the if the duration is 0', async () => {
    const result = await getEndpointsHandler(datastoreSpy() as any);
    expect(result.body.data.createStudent).toEqual({
      freshest: 'https://greenCreateStudent',
      url: 'https://greenCreateStudent',
    });
  });

});
