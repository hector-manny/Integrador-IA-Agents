import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/**
 * @param {string} isolatedFile
 * @returns {Promise<{ stdout: string, stderr: string, code: number }>}
 */
function runIsolatedTest(isolatedFile) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ['--experimental-test-module-mocks', '--test', isolatedFile],
      { cwd: root, env: process.env },
    );
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

describe('services unit tests', () => {
  it('isolated service tests pass with mocked HTTP', async () => {
    const { code, stderr } = await runIsolatedTest(
      path.join(root, 'tests/services/services.isolated.mjs'),
    );
    if (code !== 0) {
      assert.fail(`services isolated tests failed:\n${stderr}`);
    }
  });
});
