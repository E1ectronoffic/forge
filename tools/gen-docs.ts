import * as path from 'path';
import { getPackageInfo } from './utils';
import * as typedoc from 'typedoc';

(async () => {
  const packages = await getPackageInfo();

  const typedocApp = new typedoc.Application();
  typedocApp.bootstrap({
    entryPointStrategy: 'packages',
    entryPoints: packages.map((pkg) => pkg.path),
    excludeExternals: true,
    excludePrivate: true,
    excludeProtected: true,
    hideGenerator: true,
    plugin: ['typedoc-plugin-rename-defaults'],
  });

  const projReflection = typedocApp.convert();
  if (projReflection === undefined) {
    throw new Error('Failed to find package sources');
  }

  await typedocApp.generateDocs(projReflection, path.resolve(__dirname, '..', 'docs'));
})().catch(console.error);
