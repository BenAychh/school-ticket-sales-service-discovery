import * as packageInfo from '../package.json';
import { helloWorld } from './index';

describe('helloWorld', () => {
  const request = Object.freeze({}) as any;
  test('returns the correct status code', () => {
    expect(helloWorld(request).code).toEqual(200);
  });

  test('returns the correct api version', () => {
    expect(helloWorld(request).body.apiVersion).toEqual(packageInfo.version);
  });

  test('returns the correct api version', () => {
    expect(helloWorld(request).body.data).toEqual({
      message: 'Hello World',
    });
  });
});
