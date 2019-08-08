import MakerBase, { MakerOptions } from '@electron-forge/maker-base';
import { ForgeArch, ForgePlatform } from '@electron-forge/shared-types';

import fs from 'fs-extra';
import path from 'path';

import { MakerFlatpakConfig } from './Config';

export function flatpakArch(nodeArch: ForgeArch) {
  switch (nodeArch) {
    case 'ia32': return 'i386';
    case 'x64': return 'x86_64';
    case 'armv7l': return 'arm';
    // arm => arm
    default: return nodeArch;
  }
}

export default class MakerFlatpak extends MakerBase<MakerFlatpakConfig> {
  name = 'flatpak';

  defaultPlatforms: ForgePlatform[] = ['linux'];

  isSupportedOnCurrentPlatform() {
    return this.isInstalled('@malept/electron-installer-flatpak');
  }

  async make({
    dir,
    makeDir,
    targetArch,
  }: MakerOptions) {
    // eslint-disable-next-line global-require, import/no-unresolved
    const installer = require('@malept/electron-installer-flatpak');

    const arch = flatpakArch(targetArch);
    const outDir = path.resolve(makeDir, 'flatpak');

    await this.ensureDirectory(outDir);
    const flatpakConfig = Object.assign({}, this.config, {
      arch,
      src: dir,
      dest: outDir,
    });

    await installer(flatpakConfig);

    return (await fs.readdir(outDir))
      .filter(basename => basename.endsWith('.flatpak'))
      .map(basename => path.join(outDir, basename));
  }
}
