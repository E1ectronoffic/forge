import { builtinModules } from 'node:module';
import pkg from './package.json';

export const builtins = [
  'electron',
  ...builtinModules.map((m) => [m, `node:${m}`]).flat(),
];

export const external = [
  ...builtins,
  ...Object.keys(pkg.dependencies || {}),
];

/** @type {(env: import('vite').ConfigEnv & { root: string; }) => import('vite').UserConfig} */
export const configFn = (env) => ({
  root: env.root,
  mode: env.mode,
  build: {
    // Prevent multiple builds from interfering with each other.
    emptyOutDir: false,
    // 🚧 Multiple builds may conflict.
    outDir: '.vite/build',
    minify: env.command === 'build',
    watch: env.command === 'serve' ? {} : null,
  },
  clearScreen: false,
});

/** @type {(name: string) => { VITE_DEV_SERVER_URL: string; VITE_NAME: string }} */
export const getDefineKeys = (name) => {
  const NAME = name.toUpperCase();

  return {
    VITE_DEV_SERVER_URL: `${NAME}_VITE_DEV_SERVER_URL`,
    VITE_NAME: `${NAME}_VITE_NAME`,
  };
}

/** @type {(name: string) => import('vite').Plugin} */
export const pluginExposeDefineToEnv = (name) => {
  const { VITE_DEV_SERVER_URL } = getDefineKeys(name);

  return {
    name: '@electron-forge/plugin-vite:define-to-env',
    configureServer(server) {
      server.httpServer?.once('listening', () => {

        /** @type {import('node:net').AddressInfo} */
        const addressInfo = server.httpServer?.address();
        process.env[VITE_DEV_SERVER_URL] = `http://localhost:${addressInfo?.port}`;
      });
    },
  }
}
