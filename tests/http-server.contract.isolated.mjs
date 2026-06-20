import { describe, it } from 'node:test';

import assert from 'node:assert/strict';

import path from 'node:path';

import { fileURLToPath, pathToFileURL } from 'node:url';

import { createApp } from '../src/http/server.js';

import { buildFixtureLocationContext } from './helpers/fixture-location-context.js';

import { assertLocationContextShape } from './helpers/assert-location-context.js';

import { httpGet, withHttpServer } from './helpers/http-test-server.js';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const orchestratorModule = pathToFileURL(
  path.join(projectRoot, 'src/orchestrators/location-context.orchestrator.js'),
).href;

describe('HTTP server contract isolated', () => {
  it('GET /context returns fixture LocationContext', async (t) => {
    t.mock.module(orchestratorModule, {
      exports: {
        getLocationContext: async (zip) => buildFixtureLocationContext(zip),

        getLocationContexts: async (zips) => zips.map((zip) => buildFixtureLocationContext(zip)),

        validateZipInput: () => null,
      },
    });

    await withHttpServer(async (baseUrl) => {
      const { status, body } = await httpGet(baseUrl, '/context?zip=80203');

      assert.equal(status, 200);

      assertLocationContextShape(body);

      assert.equal(body.input.zip, '80203');
    }, createApp);
  });

  it('GET /contexts returns mixed validation errors and contexts', async (t) => {
    t.mock.module(orchestratorModule, {
      exports: {
        getLocationContext: async (zip) => buildFixtureLocationContext(zip),

        getLocationContexts: async (zips) => zips.map((zip) => buildFixtureLocationContext(zip)),

        validateZipInput: (zip) =>
          zip === 'abc12'
            ? { error: true, code: 'INVALID_ZIP', message: 'Invalid US ZIP code' }
            : null,
      },
    });

    await withHttpServer(async (baseUrl) => {
      const { status, body } = await httpGet(baseUrl, '/contexts?zips=abc12,80203');

      assert.equal(status, 200);

      assert.equal(body[0].code, 'INVALID_ZIP');

      assertLocationContextShape(body[1]);
    }, createApp);
  });
});
