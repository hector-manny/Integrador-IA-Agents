import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  aqiToLevel,
  dominantPollutant,
  normalizePollutantKey,
} from '../src/logic/air-quality-mapper.js';

describe('air-quality-mapper', () => {
  it('maps AQI US to EPA level bands', () => {
    assert.equal(aqiToLevel(38), 'Good');
    assert.equal(aqiToLevel(75), 'Moderate');
    assert.equal(aqiToLevel(120), 'Unhealthy for Sensitive Groups');
    assert.equal(aqiToLevel(180), 'Unhealthy');
    assert.equal(aqiToLevel(250), 'Very Unhealthy');
    assert.equal(aqiToLevel(350), 'Hazardous');
  });

  it('normalizes Open-Meteo pollutant keys to canonical form', () => {
    assert.equal(normalizePollutantKey('ozone'), 'o3');
    assert.equal(normalizePollutantKey('nitrogen_dioxide'), 'no2');
    assert.equal(normalizePollutantKey('pm2_5'), 'pm2_5');
  });

  it('returns dominant pollutant with canonical key', () => {
    assert.equal(dominantPollutant({ pm2_5: 10, ozone: 25, nitrogen_dioxide: 5 }), 'o3');
    assert.equal(dominantPollutant({ pm2_5: 30, pm10: 10 }), 'pm2_5');
    assert.equal(dominantPollutant({}), 'unknown');
  });
});
