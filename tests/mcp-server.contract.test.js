import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createMcpServer } from '../src/mcp/mcp-server.js';
import { withMcpClient } from './helpers/mcp-test-client.js';

describe('MCP server contract (offline)', () => {
  it('lists get_location_context and get_location_contexts tools', async () => {
    await withMcpClient(createMcpServer, async (client) => {
      const { tools } = await client.listTools();
      const names = tools.map((tool) => tool.name);
      assert.ok(names.includes('get_location_context'));
      assert.ok(names.includes('get_location_contexts'));
    });
  });

  it('get_location_context with invalid ZIP is rejected by MCP input schema', async () => {
    await withMcpClient(createMcpServer, async (client) => {
      const result = await client.callTool({
        name: 'get_location_context',
        arguments: { zip: 'abc12' },
      });
      assert.equal(result.isError, true);
      const text = result.content?.[0]?.text ?? '';
      assert.match(text, /validation error|Invalid US ZIP/i);
    });
  });

  it('get_location_contexts rejects batch when any ZIP fails MCP input schema', async () => {
    await withMcpClient(createMcpServer, async (client) => {
      const result = await client.callTool({
        name: 'get_location_contexts',
        arguments: { zips: ['abc12', '80203'] },
      });
      assert.equal(result.isError, true);
      const text = result.content?.[0]?.text ?? '';
      assert.match(text, /validation error|Invalid US ZIP/i);
    });
  });

  it('isolated contract tests pass with mocked orchestrator', async () => {
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
    const isolated = path.join(root, 'tests/mcp-server.contract.isolated.mjs');
    const code = await new Promise((resolve, reject) => {
      const child = spawn(
        process.execPath,
        ['--experimental-test-module-mocks', '--test', isolated],
        { cwd: root, env: process.env },
      );
      let stderr = '';
      child.stderr.on('data', (chunk) => {
        stderr += chunk;
      });
      child.on('error', reject);
      child.on('close', (exitCode) => {
        if (exitCode !== 0) {
          reject(new Error(`MCP contract isolated tests failed:\n${stderr}`));
        } else {
          resolve(exitCode);
        }
      });
    });
    assert.equal(code, 0);
  });
});
