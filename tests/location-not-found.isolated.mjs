import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mockLocationResolutionFailure } from './helpers/mock-location-failure.js';
import { httpGet, withHttpServer } from './helpers/http-test-server.js';
import { parseMcpToolJson, withMcpClient } from './helpers/mcp-test-client.js';

const UNRESOLVABLE_ZIP = '00000';

describe('LOCATION_NOT_FOUND when ZIP and IP fail (isolated)', () => {
  it('orchestrator returns structured error', async (t) => {
    mockLocationResolutionFailure(t);
    const { getLocationContext } =
      await import('../src/orchestrators/location-context.orchestrator.js');

    const result = await getLocationContext(UNRESOLVABLE_ZIP);
    assert.equal(result.error, true);
    assert.equal(result.code, 'LOCATION_NOT_FOUND');
    assert.match(result.message, /ZIP or IP fallback/i);
  });

  it('HTTP GET /context returns 404 with LOCATION_NOT_FOUND', async (t) => {
    mockLocationResolutionFailure(t);
    const { createApp } = await import('../src/http/server.js');

    await withHttpServer(async (baseUrl) => {
      const { status, body } = await httpGet(baseUrl, `/context?zip=${UNRESOLVABLE_ZIP}`);
      assert.equal(status, 404);
      assert.equal(body.error, true);
      assert.equal(body.code, 'LOCATION_NOT_FOUND');
    }, createApp);
  });

  it('MCP get_location_context returns isError with LOCATION_NOT_FOUND', async (t) => {
    mockLocationResolutionFailure(t);
    const { createMcpServer } = await import('../src/mcp/mcp-server.js');

    await withMcpClient(createMcpServer, async (client) => {
      const result = await client.callTool({
        name: 'get_location_context',
        arguments: { zip: UNRESOLVABLE_ZIP },
      });
      assert.equal(result.isError, true);
      const body = parseMcpToolJson(result);
      assert.equal(body.code, 'LOCATION_NOT_FOUND');
    });
  });
});
