import { it } from 'node:test';

import assert from 'node:assert/strict';

import { createMcpServer } from '../src/mcp/mcp-server.js';

import { assertLocationContextShape } from './helpers/assert-location-context.js';

import { describeLive } from './helpers/live-apis.js';

import { parseMcpToolJson, withMcpClient } from './helpers/mcp-test-client.js';

describeLive('MCP server live (requires LIVE_APIS=1)', { timeout: 60_000 }, () => {
  it('get_location_context returns valid LocationContext for 80203', async () => {
    await withMcpClient(createMcpServer, async (client) => {
      const result = await client.callTool({
        name: 'get_location_context',

        arguments: { zip: '80203' },
      });

      assert.equal(result.isError, false);

      const body = parseMcpToolJson(result);

      assertLocationContextShape(body);

      assert.equal(body.input.zip, '80203');

      assert.equal(body.input.source, 'zip');
    });
  });

  it('get_location_contexts returns multiple contexts', async () => {
    await withMcpClient(createMcpServer, async (client) => {
      const result = await client.callTool({
        name: 'get_location_contexts',

        arguments: { zips: ['80203', '10001'] },
      });

      assert.equal(result.isError, false);

      const body = parseMcpToolJson(result);

      assert.ok(Array.isArray(body));

      assert.equal(body.length, 2);

      for (const item of body) {
        assertLocationContextShape(item);
      }
    });
  });
});
