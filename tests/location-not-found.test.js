import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const isolatedTest = path.join(root, 'tests/location-not-found.isolated.mjs');

/**
 * @param {string[]} args
 * @returns {Promise<{ stdout: string, stderr: string, code: number }>}
 */
function runNodeTest(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
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

describe('LOCATION_NOT_FOUND when ZIP and IP fail', () => {
  it('orchestrator, HTTP and MCP return structured LOCATION_NOT_FOUND', async () => {
    const { code, stderr } = await runNodeTest([
      '--experimental-test-module-mocks',
      '--test',
      isolatedTest,
    ]);
    if (code !== 0) {
      assert.fail(`Isolated LOCATION_NOT_FOUND tests failed:\n${stderr}`);
    }
  });
});
