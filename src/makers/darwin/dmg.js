import path from 'path';
import pify from 'pify';

import { ensureFile } from '../../util/ensure-output';
import configFn from '../../util/config-fn';

// electron-installer-dmg doesn't set its 'os' field even though it depends on
// appdmg, which is darwin-only
export const isSupportedOnCurrentPlatform = async () => process.platform === 'darwin';

export default async ({ dir, appName, targetArch, forgeConfig, packageJSON }) => {
  const electronDMG = require('electron-installer-dmg');

  const outPath = path.resolve(dir, '../make', `${appName}-${packageJSON.version}.dmg`);
  await ensureFile(outPath);
  const dmgConfig = Object.assign({
    overwrite: true,
    name: appName,
  }, configFn(forgeConfig.electronInstallerDMG, targetArch), {
    appPath: path.resolve(dir, `${appName}.app`),
    out: path.dirname(outPath),
  });
  await pify(electronDMG)(dmgConfig);
  return [outPath];
};
