import path from 'path';

import debug from 'debug';

const d = debug('electron-forge:require-search');

// https://github.com/nodejs/node/blob/da0ede1ad55a502a25b4139f58aab3fb1ee3bf3f/lib/internal/modules/cjs/loader.js#L353-L359
type RequireError = Error & {
  code: string;
  path: string;
  requestPath: string | undefined;
};

export function requireSearchRaw<T>(relativeTo: string, paths: string[]): T | null {
  const testPaths = paths
    .concat(paths.map((mapPath) => path.resolve(relativeTo, mapPath)))
    .concat(paths.map((mapPath) => path.resolve(relativeTo, 'node_modules', mapPath)));
  d('searching', testPaths, 'relative to', relativeTo);
  for (const testPath of testPaths) {
    try {
      d('testing', testPath);
      return require(testPath);
    } catch (err) {
      if (err instanceof Error) {
        const requireErr = err as RequireError;
        // Ignore require-related errors
        if (requireErr.code !== 'MODULE_NOT_FOUND' || ![undefined, testPath].includes(requireErr.requestPath)) {
          throw err;
        }
      }
    }
  }
  // TODO: Is this ok to include in releases?
  if (__dirname.includes('forge/packages/api/core/') && paths.length === 1) {
    const [moduleType, moduleName] = paths[0].split('/')[1].split('-');
    try {
      const localPath = path.resolve(__dirname, '..', '..', '..', '..', moduleType, moduleName);
      d('testing local forge build', { moduleType, moduleName, localPath });
      return require(localPath);
    } catch {
      // Ignore
    }
  }
  d('failed to find a module in', testPaths);
  return null;
}

export type PossibleModule<T> = {
  default?: T;
} & T;

export default <T>(relativeTo: string, paths: string[]): T | null => {
  const result = requireSearchRaw<PossibleModule<T>>(relativeTo, paths);
  return typeof result === 'object' && result && result.default ? result.default : (result as T | null);
};
