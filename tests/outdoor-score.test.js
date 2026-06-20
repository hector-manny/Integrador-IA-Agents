import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateOutdoorScore, finalizeOutdoorScore } from '../src/logic/outdoor-score.js';

describe('outdoor-score', () => {
  it('returns high score for ideal conditions', () => {
    const { score, explanation } = calculateOutdoorScore({
      temperature_c: 22,
      windspeed_kmh: 10,
      condition: 'Clear',
      aqi_us: 30,
    });
    assert.ok(score !== null);
    assert.ok(score >= 8);
    assert.match(explanation, /Score \d+\/10/);
  });

  it('returns low score for adverse conditions', () => {
    const { score } = calculateOutdoorScore({
      temperature_c: 38,
      windspeed_kmh: 45,
      condition: 'Thunderstorm',
      aqi_us: 180,
    });
    assert.ok(score !== null);
    assert.ok(score <= 3);
  });

  it('clamps score between 1 and 10', () => {
    const worst = calculateOutdoorScore({
      temperature_c: -10,
      windspeed_kmh: 60,
      condition: 'Severe Thunderstorm',
      aqi_us: 300,
    });
    assert.equal(worst.score, 1);

    const best = calculateOutdoorScore({
      temperature_c: 22,
      windspeed_kmh: 5,
      condition: 'Clear',
      aqi_us: 10,
    });
    assert.equal(best.score, 10);
  });

  it('calculates with partial data (weather only)', () => {
    const { score, explanation } = calculateOutdoorScore({
      temperature_c: 20,
      windspeed_kmh: 12,
      condition: 'Mainly Clear',
    });
    assert.ok(score !== null);
    assert.ok(score >= 1 && score <= 10);
    assert.match(explanation, /temperatura/);
    assert.doesNotMatch(explanation, /AQI/);
  });

  it('returns score 10 for ideal NYC-like day', () => {
    const { score } = calculateOutdoorScore({
      temperature_c: 22,
      windspeed_kmh: 10,
      condition: 'Clear',
      aqi_us: 42,
    });
    assert.equal(score, 10);
  });

  it('returns score 8 for Dallas-like day at ideal temp edge', () => {
    const { score } = calculateOutdoorScore({
      temperature_c: 26,
      windspeed_kmh: 20.3,
      condition: 'Cloudy',
      aqi_us: 57,
    });
    assert.equal(score, 8);
  });

  it('returns score 6 when temp slightly above ideal range', () => {
    const { score } = calculateOutdoorScore({
      temperature_c: 26.4,
      windspeed_kmh: 20.3,
      condition: 'Cloudy',
      aqi_us: 57,
    });
    assert.equal(score, 6);
  });

  it('returns score 9 for Boston-like windy clear day', () => {
    const { score } = calculateOutdoorScore({
      temperature_c: 25.5,
      windspeed_kmh: 28.5,
      condition: 'Mainly Clear',
      aqi_us: 43,
    });
    assert.equal(score, 9);
  });

  it('returns null when no weather or air data', () => {
    const { score, explanation } = calculateOutdoorScore({});
    assert.equal(score, null);
    assert.match(explanation, /No hay datos suficientes/);
  });

  it('finalizeOutdoorScore penalizes ip_fallback by 1', () => {
    assert.equal(finalizeOutdoorScore(10, 'ip_fallback'), 9);
    assert.equal(finalizeOutdoorScore(1, 'ip_fallback'), 1);
    assert.equal(finalizeOutdoorScore(10, 'zip'), 10);
    assert.equal(finalizeOutdoorScore(null, 'ip_fallback'), null);
  });
});
