import { expect } from 'chai';
import path from 'path';

import findConfig from '../../src/util/forge-config';

const defaults = {
  make_targets: {
    win32: ['squirrel', 'appx'],
    darwin: ['zip'],
    linux: ['deb', 'rpm'],
    mas: ['zip'],
  },
  electronInstallerDMG: {},
  electronPackagerConfig: {},
  electronWinstallerConfig: {},
  electronInstallerDebian: {},
  electronInstallerRedhat: {},
  publish_targets: {
    win32: ['github'],
    darwin: ['github'],
    linux: ['github'],
    mas: ['github'],
  },
  github_repository: {},
  s3: {},
};

describe('forge-config', () => {
  it('should resolve the object in package.json with defaults  if one exists', async () => {
    expect(await findConfig(path.resolve(__dirname, '../fixture/dummy_app'))).to.be.deep.equal(Object.assign({}, defaults, {
      electronWinstallerConfig: { windows: 'magic' },
      windowsStoreConfig: { packageName: 'test' },
      github_repository: {
        name: 'project',
        owner: 'dummy',
      },
    }));
  });

  it('should resolve the JS file exports in config.forge points to a JS file', async () => {
    expect(JSON.parse(JSON.stringify(await findConfig(path.resolve(__dirname, '../fixture/dummy_js_conf'))))).to.be.deep.equal(Object.assign({}, defaults, {
      electronPackagerConfig: { foo: 'bar' },
    }));
  });

  it('should resolve the JS file exports in config.forge points to a JS file and maintain functions', async () => {
    const conf = await findConfig(path.resolve(__dirname, '../fixture/dummy_js_conf'));
    expect(conf.magicFn).to.be.a('function');
    expect(conf.magicFn()).to.be.equal('magic result');
  });

  it('should magically map properties to environment variables', async () => {
    const conf = await findConfig(path.resolve(__dirname, '../fixture/dummy_js_conf'));
    expect(conf.s3.secretAccessKey).to.equal(undefined);

    process.env.ELECTRON_FORGE_S3_SECRET_ACCESS_KEY = 'SecretyThing';
    expect(conf.s3.secretAccessKey).to.equal('SecretyThing');
    delete process.env.ELECTRON_FORGE_S3_SECRET_ACCESS_KEY;
  });
});
