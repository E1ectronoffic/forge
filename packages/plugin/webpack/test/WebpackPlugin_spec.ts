import { expect } from 'chai';
import { ForgeConfig } from '@electron-forge/shared-types';
import * as fs from 'fs-extra';
import * as path from 'path';
import { tmpdir } from 'os';

import { WebpackPluginConfig } from '../src/Config';
import WebpackPlugin from '../src/WebpackPlugin';

describe('WebpackPlugin', () => {
  const baseConfig: WebpackPluginConfig = {
    mainConfig: {},
    renderer: {
      config: {},
      entryPoints: [],
    },
  };

  const webpackTestDir = path.resolve(tmpdir(), 'electron-forge-plugin-webpack-test');

  describe('TCP port', () => {
    it('should fail for privileged ports', () => {
      expect(() => new WebpackPlugin({ ...baseConfig, loggerPort: 80 })).to.throw(/privileged$/);
    });

    it('should fail for too-large port numbers', () => {
      expect(() => new WebpackPlugin({ ...baseConfig, loggerPort: 99999 })).to.throw(/not a valid TCP port/);
    });
  });

  describe('packageAfterCopy', () => {
    const packageJSONPath = path.join(webpackTestDir, 'package.json');
    const packagedPath = path.join(webpackTestDir, 'packaged');
    const packagedPackageJSONPath = path.join(packagedPath, 'package.json');
    let plugin: WebpackPlugin;

    before(async () => {
      await fs.ensureDir(packagedPath);
      plugin = new WebpackPlugin(baseConfig);
      plugin.setDirectories(webpackTestDir);
    });

    it('should remove config.forge from package.json', async () => {
      const packageJSON = { config: { forge: 'config.js' } };
      await fs.writeJson(packageJSONPath, packageJSON);
      await plugin.packageAfterCopy(null, packagedPath);
      expect(await fs.pathExists(packagedPackageJSONPath)).to.equal(true);
      expect((await fs.readJson(packagedPackageJSONPath)).config).to.not.have.property('forge');
    });

    it('should succeed if there is no config.forge', async () => {
      const packageJSON = { name: 'test' };
      await fs.writeJson(packageJSONPath, packageJSON);
      await plugin.packageAfterCopy(null, packagedPath);
      expect(await fs.pathExists(packagedPackageJSONPath)).to.equal(true);
      expect((await fs.readJson(packagedPackageJSONPath))).to.not.have.property('config');
    });

    after(async () => {
      await fs.remove(webpackTestDir);
    });
  });

  describe('resolveForgeConfig', () => {
    let plugin: WebpackPlugin;

    before(() => {
      plugin = new WebpackPlugin(baseConfig);
    });

    it('sets packagerConfig and packagerConfig.ignore if it does not exist', async () => {
      const config = await plugin.resolveForgeConfig({} as ForgeConfig);
      expect(config.packagerConfig).to.not.equal(undefined);
      expect(config.packagerConfig.ignore).to.be.a('function');
    });

    describe('packagerConfig.ignore', () => {
      it('does not overwrite an existing ignore value', async () => {
        const config = await plugin.resolveForgeConfig({
          packagerConfig: {
            ignore: /test/,
          },
        } as ForgeConfig);

        expect(config.packagerConfig.ignore).to.deep.equal(/test/);
      });

      it('ignores everything but files in .webpack', async () => {
        const config = await plugin.resolveForgeConfig({} as ForgeConfig);
        const ignore = config.packagerConfig.ignore as Function;

        expect(ignore('')).to.equal(false);
        expect(ignore('/abc')).to.equal(true);
        expect(ignore('/.webpack')).to.equal(false);
        expect(ignore('/.webpack/foo')).to.equal(false);
      });

      it('ignores files generated by jsonStats config', async () => {
        const webpackConfig = { ...baseConfig, jsonStats: true };
        webpackConfig.renderer.jsonStats = true;
        plugin = new WebpackPlugin(webpackConfig);
        const config = await plugin.resolveForgeConfig({} as ForgeConfig);
        const ignore = config.packagerConfig.ignore as Function;

        expect(ignore('/.webpack/main/stats.json')).to.equal(true);
        expect(ignore('/.webpack/renderer/stats.json')).to.equal(true);
      });
    });
  });
});
