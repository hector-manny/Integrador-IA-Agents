import { it } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { assertLocationContextShape } from './helpers/assert-location-context.js';
import { describeLive } from './helpers/live-apis.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cli = path.join(root, 'src/cli/cli.js');

/**
 * @param {string[]} args
 * @returns {Promise<{ stdout: string, stderr: string, code: number }>}
 */
function runCli(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [cli, ...args], {
      cwd: root,
      env: process.env,
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', reject);
    child.on('close', (code) => {
      resolve({ stdout, stderr, code: code ?? 1 });
    });
  });
}

describeLive('E2E CLI live (requires LIVE_APIS=1)', { timeout: 60_000 }, () => {
  it('80203 returns valid LocationContext with source zip', async () => {
    const { stdout, code } = await runCli(['80203']);
    assert.equal(code, 0);
    const body = JSON.parse(stdout);
    assertLocationContextShape(body);
    assert.equal(body.input.zip, '80203');
    assert.equal(body.input.source, 'zip');
    assert.equal(body.location.city, 'Denver');
  });

  it('99999 falls back to IP with source ip_fallback', async () => {
    const { stdout, code } = await runCli(['99999']);
    assert.equal(code, 0);
    const body = JSON.parse(stdout);
    assertLocationContextShape(body);
    assert.equal(body.input.zip, '99999');
    assert.equal(body.input.source, 'ip_fallback');
  });

  it('multiple ZIPs returns array of contexts', async () => {
    const { stdout, code } = await runCli(['80203', '10001']);
    assert.equal(code, 0);
    const body = JSON.parse(stdout);
    assert.ok(Array.isArray(body));
    assert.equal(body.length, 2);
    for (const item of body) {
      assertLocationContextShape(item);
    }
    assert.equal(body[0].input.zip, '80203');
    assert.equal(body[1].input.zip, '10001');
  });

  it('second call same ZIP hits in-process cache', async () => {
    const { getLocationContext } =
      await import('../src/orchestrators/location-context.orchestrator.js');
    const zip = '33101';
    const first = await getLocationContext(zip);
    assert.equal(first.input?.zip, zip);

    const t0 = Date.now();
    const second = await getLocationContext(zip);
    const elapsed = Date.now() - t0;

    assert.equal(second.input?.zip, zip);
    assert.deepEqual(second, first);
    assert.ok(elapsed < 50, `Expected in-process cache hit under 50ms, got ${elapsed}ms`);
  });
});
