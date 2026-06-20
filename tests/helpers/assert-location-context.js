import assert from 'node:assert/strict';

/**
 * @param {unknown} body
 */
export function assertLocationContextShape(body) {
  assert.equal(typeof body, 'object');
  assert.notEqual(body, null);
  assert.ok('input' in body);
  assert.ok(['zip', 'ip_fallback'].includes(body.input.source));
  assert.ok(typeof body.input.zip === 'string');
  assert.ok(body.location?.city);
  assert.ok(body.location?.state);
  assert.ok(body.location?.country);
  assert.ok(typeof body.location?.lat === 'number');
  assert.ok(typeof body.location?.lon === 'number');
  if (body.weather) {
    assert.ok(typeof body.weather.temperature_c === 'number');
    assert.ok(typeof body.weather.windspeed_kmh === 'number');
    assert.ok(typeof body.weather.condition === 'string');
  }
  if (body.air_quality) {
    assert.ok(typeof body.air_quality.aqi_us === 'number');
    assert.ok(typeof body.air_quality.level === 'string');
    assert.ok(typeof body.air_quality.dominant_pollutant === 'string');
  }
  if (body.outdoor_score !== null) {
    assert.ok(body.outdoor_score >= 1 && body.outdoor_score <= 10);
  }

  const ac = body.agent_context;
  assert.ok(ac?.summary);
  assert.ok(ac?.headline);
  assert.ok(ac?.tldr);
  assert.ok(['urgent', 'cautious', 'informative', 'friendly'].includes(ac.response_tone));
  assert.equal(typeof ac.flags?.outdoor_friendly, 'boolean');
  assert.ok(ac.recommendations?.clothing);
  assert.ok(Array.isArray(ac.recommendations?.suitable_activities));
  assert.ok(Array.isArray(ac.alerts));
  assert.equal(typeof ac.followup_hints?.user_location_known, 'boolean');
  assert.ok(ac.meta?.generated_at);
  assert.ok(['zip', 'ip_fallback'].includes(ac.meta?.location_source));
}
