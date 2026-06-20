import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { detectRiskFlags, formatRiskFlags } from '../src/logic/risk-flags.js';

describe('detectRiskFlags', () => {
  it('detects cold_temperature at <= 5°C', () => {
    const flags = detectRiskFlags({
      weather: { temperature_c: 5, windspeed_kmh: 10, condition: 'Clear' },
    });
    assert.ok(flags.includes('cold_temperature'));
  });

  it('detects high_temperature at >= 32°C', () => {
    const flags = detectRiskFlags({
      weather: { temperature_c: 32, windspeed_kmh: 10, condition: 'Clear' },
    });
    assert.ok(flags.includes('high_temperature'));
  });

  it('detects strong_wind at >= 35 km/h', () => {
    const flags = detectRiskFlags({
      weather: { temperature_c: 20, windspeed_kmh: 35, condition: 'Clear' },
    });
    assert.ok(flags.includes('strong_wind'));
  });

  it('detects poor_air_quality at AQI >= 101', () => {
    const flags = detectRiskFlags({
      air_quality: { aqi_us: 101 },
    });
    assert.ok(flags.includes('poor_air_quality'));
  });

  it('detects storm_weather for thunderstorm', () => {
    const flags = detectRiskFlags({
      weather: { temperature_c: 20, windspeed_kmh: 10, condition: 'Thunderstorm' },
    });
    assert.ok(flags.includes('storm_weather'));
    assert.ok(!flags.includes('rainy_weather'));
  });

  it('detects rainy_weather for rain conditions', () => {
    const flags = detectRiskFlags({
      weather: { temperature_c: 20, windspeed_kmh: 10, condition: 'Heavy Rain' },
    });
    assert.ok(flags.includes('rainy_weather'));
  });

  it('detects snow_weather for snow', () => {
    const flags = detectRiskFlags({
      weather: { temperature_c: -2, windspeed_kmh: 10, condition: 'Heavy Snow' },
    });
    assert.ok(flags.includes('snow_weather'));
    assert.ok(flags.includes('cold_temperature'));
  });

  it('formatRiskFlags returns Spanish labels', () => {
    const labels = formatRiskFlags(['strong_wind', 'storm_weather']);
    assert.deepEqual(labels, ['Viento moderado', 'Tormenta']);
  });
});
