import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mapWeatherCode, WMO_MAP } from '../src/logic/weather-mapper.js';

describe('weather-mapper', () => {
  it('maps clear sky (0) to Clear', () => {
    assert.equal(mapWeatherCode(0), 'Clear');
  });

  it('maps partly cloudy (2) to Partly Cloudy', () => {
    assert.equal(mapWeatherCode(2), 'Partly Cloudy');
  });

  it('maps fog (45) to Foggy', () => {
    assert.equal(mapWeatherCode(45), 'Foggy');
  });

  it('maps moderate rain (55) to Moderate Rain', () => {
    assert.equal(mapWeatherCode(55), 'Moderate Rain');
  });

  it('maps thunderstorm (95) to Thunderstorm', () => {
    assert.equal(mapWeatherCode(95), 'Thunderstorm');
  });

  it('returns Unknown for unmapped WMO codes', () => {
    assert.equal(mapWeatherCode(999), 'Unknown');
    assert.equal(mapWeatherCode(-1), 'Unknown');
  });

  it('covers all entries in WMO_MAP', () => {
    for (const [code, label] of Object.entries(WMO_MAP)) {
      assert.equal(mapWeatherCode(Number(code)), label);
    }
  });
});
