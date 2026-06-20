import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { parseConfig } from '../src/models/config.schema.js';
import { getConfig, resetConfigCache } from '../src/config.js';

describe('config', () => {
  const validEnv = {
    PORT: '3000',
    CACHE_TTL_SECONDS: '600',
    HTTP_TIMEOUT_MS: '5000',
    IP_API_BASE_URL: 'http://ip-api.com',
  };

  it('parseConfig accepts valid defaults', () => {
    const config = parseConfig(validEnv);
    assert.equal(config.port, 3000);
    assert.equal(config.cacheTtlSeconds, 600);
    assert.equal(config.httpTimeoutMs, 5000);
    assert.equal(config.ipApiBaseUrl, 'http://ip-api.com');
  });

  it('parseConfig rejects invalid PORT', () => {
    assert.throws(() => parseConfig({ ...validEnv, PORT: 'abc' }), /PORT/);
  });

  it('parseConfig rejects non-positive PORT', () => {
    assert.throws(() => parseConfig({ ...validEnv, PORT: '0' }), /PORT/);
  });

  it('getConfig caches parsed config', () => {
    resetConfigCache();
    const first = getConfig();
    const second = getConfig();
    assert.equal(first, second);
    resetConfigCache();
  });
});
