import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

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

describe('E2E CLI contract (offline)', () => {
  it('invalid ZIP format returns structured error without crash', async () => {
    const { stdout, code } = await runCli(['abc12']);
    assert.equal(code, 1);
    const body = JSON.parse(stdout);
    assert.equal(body.error, true);
    assert.equal(body.code, 'INVALID_ZIP');
    assert.ok(body.message);
  });

  it('no args prints usage and exits 1', async () => {
    const { stderr, code } = await runCli([]);
    assert.equal(code, 1);
    assert.match(stderr, /Usage:/);
  });

  it('isolated contract tests pass with mocked orchestrator', async () => {
    const isolated = path.join(root, 'tests/e2e-cli.contract.isolated.mjs');
    const child = spawn(
      process.execPath,
      ['--experimental-test-module-mocks', '--test', isolated],
      {
        cwd: root,
        env: process.env,
      },
    );
    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    const code = await new Promise((resolve, reject) => {
      child.on('error', reject);
      child.on('close', resolve);
    });
    if (code !== 0) {
      assert.fail(`CLI contract isolated tests failed:\n${stderr}`);
    }
  });
});
