import path from 'path';

import { getElectronModulePath } from '@electron-forge/core-utils';
import logSymbols from 'log-symbols';

type PackageJSON = Record<string, unknown>;

export default function locateElectronExecutable(dir: string, packageJSON: PackageJSON): string {
  const electronModulePath: string | undefined = getElectronModulePath(dir, packageJSON);

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  let electronExecPath = require(electronModulePath || path.resolve(dir, 'node_modules/electron'));

  if (typeof electronExecPath !== 'string') {
    console.warn(logSymbols.warning, 'Returned Electron executable path is not a string, defaulting to a hardcoded location. Value:', electronExecPath);
    electronExecPath = require(path.resolve(dir, 'node_modules/electron'));
  }

  return electronExecPath;
}
