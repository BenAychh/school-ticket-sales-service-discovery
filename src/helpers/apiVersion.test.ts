import * as packageInfo from '../../package.json';
import { apiVersion } from './apiVersion';

describe('apiVersion', () => {
  it('returns the correct api version', () => {
    expect(apiVersion()).toEqual(packageInfo.version);
  });
});
