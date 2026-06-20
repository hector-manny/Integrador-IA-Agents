import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/**
 * @param {import('node:test').TestContext} t
 */
export function mockLocationResolutionFailure(t) {
  const zipError = Object.assign(new Error('ZIP not found: 00000'), {
    code: 'LOCATION_NOT_FOUND',
  });
  const ipError = Object.assign(new Error('IP geolocation failed'), {
    code: 'LOCATION_NOT_FOUND',
  });

  const zipModule = pathToFileURL(path.join(projectRoot, 'src/services/zip.service.js')).href;
  const ipModule = pathToFileURL(
    path.join(projectRoot, 'src/services/ip-fallback.service.js'),
  ).href;

  t.mock.module(zipModule, {
    exports: {
      resolveZip: async () => {
        throw zipError;
      },
    },
  });

  t.mock.module(ipModule, {
    exports: {
      resolveByIp: async () => {
        throw ipError;
      },
    },
  });
}
