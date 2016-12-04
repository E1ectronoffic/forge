import debug from 'debug';
import fs from 'fs-promise';
import path from 'path';

const d = debug('electron-forge:project-resolver');

export default async (dir) => {
  let mDir = dir;
  let prevDir;
  while (prevDir !== mDir) {
    prevDir = mDir;
    const testPath = path.resolve(mDir, 'package.json');
    d('searching for project in', testPath);
    if (await fs.exists(testPath)) {
      const packageJSON = JSON.parse(await fs.readFile(testPath, 'utf8'));

      if (packageJSON.devDependencies && packageJSON.devDependencies['electron-prebuilt-compile']) {
        if (!/[0-9]/.test(packageJSON.devDependencies['electron-prebuilt-compile'][0])) {
          global._resolveError = () => console.error('You must depend on an EXACT version of "electron-prebuilt-compile" not a range'.red);
          return null;
        }
      } else {
        global._resolveError = () => console.error('You must depend on "electron-prebuilt-compile" in your devDependencies'.red);
        return null;
      }

      if (packageJSON.config && packageJSON.config.forge) {
        d('electron-forge compatible package.json found in', testPath);
        return mDir;
      }
    }
    mDir = path.dirname(mDir);
  }
  return null;
};
