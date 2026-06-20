import { describe, it } from 'node:test';

import assert from 'node:assert/strict';

import { createApp } from '../src/http/server.js';

import { httpGet, withHttpServer } from './helpers/http-test-server.js';

describe('HTTP server contract (offline)', () => {
  it('GET /context without zip returns 400 INVALID_ZIP', async () => {
    await withHttpServer(async (baseUrl) => {
      const { status, body } = await httpGet(baseUrl, '/context');

      assert.equal(status, 400);

      assert.equal(body.error, true);

      assert.equal(body.code, 'INVALID_ZIP');
    });
  });

  it('GET /context?zip=abc12 returns 400 INVALID_ZIP', async () => {
    await withHttpServer(async (baseUrl) => {
      const { status, body } = await httpGet(baseUrl, '/context?zip=abc12');

      assert.equal(status, 400);

      assert.equal(body.code, 'INVALID_ZIP');
    });
  });

  it('GET /contexts without zips returns 400 INVALID_ZIP', async () => {
    await withHttpServer(async (baseUrl) => {
      const { status, body } = await httpGet(baseUrl, '/contexts');

      assert.equal(status, 400);

      assert.equal(body.code, 'INVALID_ZIP');
    });
  });

  it('GET /contexts accepts more than 10 ZIPs', async () => {
    const zips = Array.from({ length: 11 }, (_, index) =>
      String(80000 + index).padStart(5, '0'),
    ).join(',');

    await withHttpServer(async (baseUrl) => {
      const { status } = await httpGet(baseUrl, `/contexts?zips=${zips}`);

      assert.notEqual(status, 400);
    });
  });

  it('GET /__test_error returns generic 500 without internal details', async () => {
    await withHttpServer(
      async (baseUrl) => {
        const { status, body } = await httpGet(baseUrl, '/__test_error');

        assert.equal(status, 500);

        assert.equal(body.error, true);

        assert.equal(body.code, 'INTERNAL_ERROR');

        assert.equal(body.message, 'Internal server error');

        assert.doesNotMatch(JSON.stringify(body), /sensitive-internal-detail/);
      },

      () => createApp({ enableTestRoutes: true }),
    );
  });

  it('isolated contract tests pass with mocked orchestrator', async () => {
    const { spawn } = await import('node:child_process');

    const { fileURLToPath } = await import('node:url');

    const path = await import('node:path');

    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

    const isolated = path.join(root, 'tests/http-server.contract.isolated.mjs');

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
          reject(new Error(`HTTP contract isolated tests failed:\n${stderr}`));
        } else {
          resolve(exitCode);
        }
      });
    });

    assert.equal(code, 0);
  });
});
