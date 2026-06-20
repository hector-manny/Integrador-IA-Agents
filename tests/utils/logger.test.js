import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { consoleLogger, noopLogger } from '../../src/utils/logger.js';

describe('logger', () => {
  it('noopLogger methods do not throw', () => {
    assert.doesNotThrow(() => {
      noopLogger.error('test');
      noopLogger.info('test');
    });
  });

  it('consoleLogger exposes error and info', () => {
    assert.equal(typeof consoleLogger.error, 'function');
    assert.equal(typeof consoleLogger.info, 'function');
  });
});
