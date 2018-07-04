import * as Datastore from '@google-cloud/datastore';
import { DateTime } from 'luxon';
import { getNextColorHandler } from './';

describe('getEndpointsHandler', () => {
  function queryResults() {
    return [
      { // Should return green.
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
    ];
  }

  function datastoreSpy() {
    return {
      get: jasmine.createSpy('runQuery').and.returnValue(Promise.resolve(queryResults())),
      key: jasmine.createSpy('key'),
    };
  }

  function request(): any {
    return {
      query: { name: 'createAccount' },
    };
  }

  beforeEach(() => {
    spyOn(DateTime, 'utc').and.returnValue(DateTime.fromISO('2018-06-12T08:45:00.000Z'));
    spyOn(Math, 'random').and.returnValue(0.50);
  });

  test('sanity check, default values resolve', () => {
    return expect(getNextColorHandler(datastoreSpy() as any, request())).resolves.toBeTruthy();
  });

  test('it returns blue and isNew: true when there are no results', async () => {
    const datastore = datastoreSpy();
    datastore.get.and.returnValue(Promise.resolve([]));
    const result = await getNextColorHandler(datastore as any, request());
    expect(result.body.data).toEqual({
      isNew: true,
      nextColor: 'blue',
    });
  });

  test('it returns green and isNew: false when the current color is blue', async () => {
    const result = await getNextColorHandler(datastoreSpy() as any, request());
    expect(result.body.data).toEqual({
      isNew: false,
      nextColor: 'green',
    });
  });

  test('it returns green and isNew: false when the current color is green', async () => {
    const results = queryResults();
    results[0].color = 'green';
    const datastore = datastoreSpy();
    datastore.get.and.returnValue(Promise.resolve([results]));
    const result = await getNextColorHandler(datastore as any, request());
    expect(result.body.data).toEqual({
      isNew: false,
      nextColor: 'blue',
    });
  });
});
