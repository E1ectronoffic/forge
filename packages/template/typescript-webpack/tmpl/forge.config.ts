import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';

const config: ForgeConfig = {
  packagerConfig: {},
  rebuildConfig: {},
  makers: [new MakerSquirrel({}), new MakerZIP({}, ['darwin']), new MakerRpm({}), new MakerDeb({})],
  plugins: [
    new WebpackPlugin({
      mainConfig: './webpack.main.config.ts',
      renderer: {
        config: './webpack.renderer.config.js',
        entryPoints: [
          {
            html: './src/index.html',
            js: './src/renderer.js',
            name: 'main_window',
            preload: {
              js: './src/preload.js',
            },
          },
        ],
      },
    }),
  ],
};

export default config;
