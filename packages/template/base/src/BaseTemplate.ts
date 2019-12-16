import { asyncOra } from '@electron-forge/async-ora';
import debug from 'debug';
import { ForgeTemplate, InitTemplateOptions } from '@electron-forge/shared-types';
import fs from 'fs-extra';
import path from 'path';
// import { setInitialForgeConfig } from '@electron-forge/config';

import determineAuthor from './determine-author';

const d = debug('electron-forge:template:base');
const tmplDir = path.resolve(__dirname, '../tmpl');

export class BaseTemplate implements ForgeTemplate {
  public templateDir?: string;

  public async initializeTemplate(directory: string, { copyCIFiles }: InitTemplateOptions) {
    await asyncOra('Copying Starter Files', async () => {
      d('creating directory:', path.resolve(directory, 'src'));
      await fs.mkdirs(path.resolve(directory, 'src'));
      const rootFiles = ['_gitignore'];
      if (copyCIFiles) rootFiles.push(...['_travis.yml', '_appveyor.yml']);
      const srcFiles = ['index.css', 'index.js', 'index.html'];

      for (const file of rootFiles) {
        await this.copy(path.resolve(tmplDir, file), path.resolve(directory, file.replace(/^_/, '.')));
      }
      for (const file of srcFiles) {
        await this.copy(path.resolve(tmplDir, file), path.resolve(directory, 'src', file));
      }
    });

    await this.initializePackageJSON(directory);
  }

  async copy(source: string, target: string) {
    d(`copying "${source}" --> "${target}"`);
    await fs.copy(source, target);
  }

  async copyTemplateFile(destDir: string, basename: string) {
    await this.copy(path.join(this.templateDir!, basename), path.resolve(destDir, basename));
  }

  async initializePackageJSON(directory: string) {
    await asyncOra('Initializing NPM Module', async () => {
      const packageJSON = await fs.readJson(path.resolve(__dirname, '../tmpl/package.json'));
      // eslint-disable-next-line no-multi-assign
      packageJSON.productName = packageJSON.name = path.basename(directory).toLowerCase();
      packageJSON.author = await determineAuthor(directory);
      // setInitialForgeConfig(packageJSON);

      packageJSON.scripts.lint = 'echo "No linting configured"';

      d('writing package.json to:', directory);
      await fs.writeJson(path.resolve(directory, 'package.json'), packageJSON, { spaces: 2 });
    });
  }

  async updateFileByLine(
    inputPath: string,
    lineHandler: (line: string) => string,
    outputPath?: string | undefined,
  ) {
    const fileContents = (await fs.readFile(inputPath, 'utf8')).split('\n').map(lineHandler).join('\n');
    await fs.writeFile(outputPath || inputPath, fileContents);
    if (outputPath !== undefined) {
      await fs.remove(inputPath);
    }
  }
}

export default new BaseTemplate();
