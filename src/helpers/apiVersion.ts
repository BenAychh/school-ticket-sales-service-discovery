import * as packageInfo from '../../package.json';

export function apiVersion(): string {
  return packageInfo.version;
}
