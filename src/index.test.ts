import { helloWorld } from './';

describe('helloWorld', () => {
  const request = Object.freeze({}) as any;
  test('returns the correct status code', () => {
    expect(helloWorld(request).code).toEqual(200);
  })
})