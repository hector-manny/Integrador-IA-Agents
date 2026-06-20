import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createMcpServer } from '../src/mcp/mcp-server.js';
import { buildFixtureLocationContext } from './helpers/fixture-location-context.js';
import { assertLocationContextShape } from './helpers/assert-location-context.js';
import { parseMcpToolJson, withMcpClient } from './helpers/mcp-test-client.js';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const orchestratorModule = pathToFileURL(
  path.join(projectRoot, 'src/orchestrators/location-context.orchestrator.js'),
).href;

describe('MCP server contract isolated', () => {
  it('get_location_context returns fixture context', async (t) => {
    t.mock.module(orchestratorModule, {
      exports: {
        getLocationContext: async (zip) => buildFixtureLocationContext(zip),
        getLocationContexts: async (zips) => zips.map((zip) => buildFixtureLocationContext(zip)),
      },
    });

    await withMcpClient(createMcpServer, async (client) => {
      const result = await client.callTool({
        name: 'get_location_context',
        arguments: { zip: '80203' },
      });
      assert.equal(result.isError, false);
      const body = parseMcpToolJson(result);
      assertLocationContextShape(body);
      assert.equal(body.input.zip, '80203');
    });
  });

  it('get_location_contexts returns multiple fixture contexts', async (t) => {
    t.mock.module(orchestratorModule, {
      exports: {
        getLocationContext: async (zip) => buildFixtureLocationContext(zip),
        getLocationContexts: async (zips) => zips.map((zip) => buildFixtureLocationContext(zip)),
      },
    });

    await withMcpClient(createMcpServer, async (client) => {
      const result = await client.callTool({
        name: 'get_location_contexts',
        arguments: { zips: ['80203', '10001'] },
      });
      assert.equal(result.isError, false);
      const body = parseMcpToolJson(result);
      assert.ok(Array.isArray(body));
      assert.equal(body.length, 2);
    });
  });

  it('get_location_context returns INTERNAL_ERROR when orchestrator throws', async (t) => {
    t.mock.module(orchestratorModule, {
      exports: {
        getLocationContext: async () => {
          throw new Error('sensitive-orchestrator-failure');
        },
        getLocationContexts: async () => [],
      },
    });

    await withMcpClient(createMcpServer, async (client) => {
      const result = await client.callTool({
        name: 'get_location_context',
        arguments: { zip: '80203' },
      });
      assert.equal(result.isError, true);
      const body = parseMcpToolJson(result);
      assert.equal(body.code, 'INTERNAL_ERROR');
      assert.doesNotMatch(JSON.stringify(body), /sensitive-orchestrator-failure/);
    });
  });
});
