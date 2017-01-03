import fs from 'fs-promise';
import path from 'path';
import program from 'commander';

import './util/terminate';
import { publish } from './api';
import { getMakeOptions } from './electron-forge-make';

(async () => {
  let dir = process.cwd();
  program
    .version(require('../package.json').version)
    .arguments('[cwd]')
    .option('--auth-token', 'Authorization token for your publisher target (if required)')
    .option('--tag', 'The tag to publish to on GitHub')
    .option('--target', 'The deployment target, defaults to "github"')
    .allowUnknownOption(true)
    .action((cwd) => {
      if (!cwd) return;
      if (path.isAbsolute(cwd) && fs.existsSync(cwd)) {
        dir = cwd;
      } else if (fs.existsSync(path.resolve(dir, cwd))) {
        dir = path.resolve(dir, cwd);
      }
    })
    .parse(process.argv);

  const publishOpts = {
    dir,
    interactive: true,
    authToken: program.authToken,
    tag: program.tag,
  };
  if (program.target) publishOpts.target = program.target;

  publishOpts.makeOptions = getMakeOptions();

  await publish(publishOpts);
})();
