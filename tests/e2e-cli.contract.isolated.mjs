import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildFixtureLocationContext } from './helpers/fixture-location-context.js';
import { assertLocationContextShape } from './helpers/assert-location-context.js';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const orchestratorModule = pathToFileURL(
  path.join(projectRoot, 'src/orchestrators/location-context.orchestrator.js'),
).href;

describe('CLI contract isolated', () => {
  it('main returns fixture context for valid ZIP', async (t) => {
    t.mock.module(orchestratorModule, {
      exports: {
        getLocationContext: async (zip) => buildFixtureLocationContext(zip),
        getLocationContexts: async (zips) => zips.map((zip) => buildFixtureLocationContext(zip)),
        validateZipInput: () => null,
      },
    });

    const { main } = await import('../src/cli/cli.js');
    const originalLog = console.log;
    /** @type {string[]} */
    const lines = [];
    console.log = (...args) => {
      lines.push(args.map(String).join(' '));
    };

    try {
      const code = await main(['80203']);
      assert.equal(code, 0);
      const body = JSON.parse(lines.join('\n'));
      assertLocationContextShape(body);
      assert.equal(body.input.zip, '80203');
      assert.equal(body.location.city, 'Test City');
    } finally {
      console.log = originalLog;
    }
  });

  it('main returns array for multiple ZIPs', async (t) => {
    t.mock.module(orchestratorModule, {
      exports: {
        getLocationContext: async (zip) => buildFixtureLocationContext(zip),
        getLocationContexts: async (zips) => zips.map((zip) => buildFixtureLocationContext(zip)),
        validateZipInput: () => null,
      },
    });

    const { main } = await import('../src/cli/cli.js');
    const originalLog = console.log;
    /** @type {string[]} */
    const lines = [];
    console.log = (...args) => {
      lines.push(args.map(String).join(' '));
    };

    try {
      const code = await main(['80203', '10001']);
      assert.equal(code, 0);
      const body = JSON.parse(lines.join('\n'));
      assert.ok(Array.isArray(body));
      assert.equal(body.length, 2);
    } finally {
      console.log = originalLog;
    }
  });
});
