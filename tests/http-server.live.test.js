import { it } from 'node:test';
import assert from 'node:assert/strict';
import { assertLocationContextShape } from './helpers/assert-location-context.js';
import { describeLive } from './helpers/live-apis.js';
import { httpGet, withHttpServer } from './helpers/http-test-server.js';

describeLive('HTTP server live (requires LIVE_APIS=1)', { timeout: 60_000 }, () => {
  it('GET /context?zip=80203 returns valid LocationContext', async () => {
    await withHttpServer(async (baseUrl) => {
      const { status, body } = await httpGet(baseUrl, '/context?zip=80203');
      assert.equal(status, 200);
      assertLocationContextShape(body);
      assert.equal(body.input.zip, '80203');
      assert.equal(body.input.source, 'zip');
    });
  });

  it('GET /contexts?zips=80203,10001 returns array of contexts', async () => {
    await withHttpServer(async (baseUrl) => {
      const { status, body } = await httpGet(baseUrl, '/contexts?zips=80203,10001');
      assert.equal(status, 200);
      assert.ok(Array.isArray(body));
      assert.equal(body.length, 2);
      for (const item of body) {
        assertLocationContextShape(item);
      }
    });
  });

  it('GET /contexts?zips=abc12,80203 returns validation error plus context', async () => {
    await withHttpServer(async (baseUrl) => {
      const { status, body } = await httpGet(baseUrl, '/contexts?zips=abc12,80203');
      assert.equal(status, 200);
      assert.ok(Array.isArray(body));
      assert.equal(body.length, 2);
      assert.equal(body[0].code, 'INVALID_ZIP');
      assertLocationContextShape(body[1]);
      assert.equal(body[1].input.zip, '80203');
    });
  });
});
