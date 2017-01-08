import 'colors';
import debug from 'debug';
import fs from 'fs-promise';
import glob from 'glob';
import path from 'path';
import pify from 'pify';
import packager from 'electron-packager';
import ora from 'ora';

import electronHostArch from '../util/electron-host-arch';
import getForgeConfig from '../util/forge-config';
import packagerCompileHook from '../util/compile-hook';
import readPackageJSON from '../util/read-package-json';
import rebuildHook from '../util/rebuild';
import resolveDir from '../util/resolve-dir';

const d = debug('electron-forge:packager');

/**
 * @typedef {Object} PackageOptions
 * @property {string} [dir=process.cwd()] The path to the app to package
 * @property {boolean} [interactive=false] Whether to use sensible defaults or prompt the user visually
 * @property {string} [arch=process.arch] The target arch
 * @property {string} [platform=process.platform] The target platform.  NOTE: This is limited to be the current platform at the moment
 */

/**
 * Package an Electron application into an platform dependent format.
 *
 * @param {PackageOptions} providedOptions - Options for the Package method
 * @return {Promise} Will resolve when the package process is complete
 */
export default async (providedOptions = {}) => {
  // eslint-disable-next-line prefer-const, no-unused-vars
  let { dir, interactive, arch, platform } = Object.assign({
    dir: process.cwd(),
    interactive: false,
    arch: electronHostArch(),
    platform: process.platform,
  }, providedOptions);

  let prepareSpinner = ora.ora(`Preparing to Package Application for arch: ${(arch === 'all' ? 'ia32' : arch).cyan}`).start();
  let prepareCounter = 0;

  dir = await resolveDir(dir);
  if (!dir) {
    // eslint-disable-next-line no-throw-literal
    throw 'Failed to locate compilable Electron application';
  }

  const packageJSON = await readPackageJSON(dir);

  if (path.dirname(require.resolve(path.resolve(dir, packageJSON.main))) === dir) {
    console.error(`Entry point: ${packageJSON.main}`.red);
    // eslint-disable-next-line no-throw-literal
    throw 'The entry point to your application ("packageJSON.name") must be in a subfolder not in the top level directory';
  }

  const forgeConfig = await getForgeConfig(dir);
  let packagerSpinner;

  const packageOpts = Object.assign({
    asar: false,
    overwrite: true,
  }, forgeConfig.electronPackagerConfig, {
    afterCopy: [async (buildPath, electronVersion, pPlatform, pArch, done) => {
      if (packagerSpinner) {
        packagerSpinner.succeed();
        prepareCounter += 1;
        prepareSpinner = ora.ora(`Preparing to Package Application for arch: ${(prepareCounter === 2 ? 'armv7l' : 'x64').cyan}`).start();
      }
      await fs.remove(path.resolve(buildPath, 'node_modules/electron-compile/test'));
      const bins = await pify(glob)(path.join(buildPath, '**/.bin/**/*'));
      for (const bin of bins) {
        await fs.remove(bin);
      }
      done();
    }, async (...args) => {
      prepareSpinner.succeed();
      await packagerCompileHook(dir, ...args);
    }, async (buildPath, electronVersion, pPlatform, pArch, done) => {
      await rebuildHook(buildPath, electronVersion, pPlatform, pArch);
      packagerSpinner = ora.ora('Packaging Application').start();
      done();
    }].concat(forgeConfig.electronPackagerConfig.afterCopy ? forgeConfig.electronPackagerConfig.afterCopy.map(item =>
      (typeof item === 'string' ? require(item) : item)
    ) : []),
    afterExtract: forgeConfig.electronPackagerConfig.afterExtract ? forgeConfig.electronPackagerConfig.afterExtract.map(item =>
      (typeof item === 'string' ? require(item) : item)
    ) : [],
    dir,
    arch,
    platform,
    out: path.resolve(dir, 'out'),
    version: packageJSON.devDependencies['electron-prebuilt-compile'],
  });
  packageOpts.quiet = true;
  if (typeof packageOpts.asar === 'object' && packageOpts.unpack) {
    packagerSpinner.fail();
    throw new Error('electron-compile does not support asar.unpack yet.  Please use asar.unpackDir');
  }

  d('packaging with options', packageOpts);

  await pify(packager)(packageOpts);

  packagerSpinner.succeed();
};
