import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isMainModule } from '../../src/utils/is-main-module.js';

describe('isMainModule', () => {
  it('returns true when importMetaUrl ends with normalized argv[1]', () => {
    const originalArgv = process.argv[1];
    process.argv[1] = 'C:\\project\\src\\cli\\cli.js';

    assert.equal(isMainModule('file:///C:/project/src/cli/cli.js'), true);

    process.argv[1] = originalArgv;
  });

  it('returns false when argv[1] is missing', () => {
    const originalArgv = process.argv[1];
    process.argv[1] = undefined;

    assert.equal(isMainModule('file:///project/src/cli/cli.js'), false);

    process.argv[1] = originalArgv;
  });

  it('returns false when paths do not match', () => {
    const originalArgv = process.argv[1];
    process.argv[1] = '/project/src/http/server.js';

    assert.equal(isMainModule('file:///project/src/mcp/mcp-server.js'), false);

    process.argv[1] = originalArgv;
  });
});
