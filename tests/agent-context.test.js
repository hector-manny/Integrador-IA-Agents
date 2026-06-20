import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildAgentContext } from '../src/logic/agent-context/index.js';
import { calculateOutdoorScore, finalizeOutdoorScore } from '../src/logic/outdoor-score.js';

const baseLocation = {
  city: 'Denver',
  state: 'Colorado',
  country: 'US',
};

const denverWeather = {
  temperature_c: 14,
  windspeed_kmh: 18.2,
  condition: 'Partly Cloudy',
  observed_at: '2026-06-18T15:42',
};

const denverAir = {
  aqi_us: 38,
  level: 'Good',
  dominant_pollutant: 'pm2_5',
};

describe('buildAgentContext', () => {
  it('builds structured agent_context for ideal Denver conditions', () => {
    const ctx = buildAgentContext({
      input: { zip: '80203', source: 'zip' },
      location: baseLocation,
      weather: denverWeather,
      air_quality: denverAir,
      outdoor_score: 7,
      meta: {
        dataAgeMinutes: 0,
        ttlSeconds: 900,
        generatedAt: '2026-06-18T15:42:00-06:00',
      },
    });

    assert.match(ctx.summary, /Estás en Denver, Colorado/);
    assert.match(ctx.summary, /14°C/);
    assert.match(ctx.summary, /Son las 3:42 PM/);
    assert.match(ctx.summary, /cielo parcialmente nublado/);
    assert.doesNotMatch(ctx.summary, /cielos (despejado|nublado|parcialmente)/);
    assert.match(ctx.summary, /Buenas condiciones para estar al aire libre/);
    assert.equal(ctx.headline, 'Buen día para salir en Denver');
    assert.equal(ctx.response_tone, 'friendly');
    assert.match(ctx.tldr, /14°C/);
    assert.match(ctx.tldr, /aire limpio/);
    assert.equal(ctx.flags.outdoor_friendly, true);
    assert.equal(ctx.flags.needs_jacket, true);
    assert.equal(ctx.flags.location_confidence, 'high');
    assert.equal(ctx.recommendations.clothing, 'Chaqueta o suéter ligero');
    assert.ok(ctx.recommendations.suitable_activities.length >= 2);
    assert.equal(ctx.recommendations.hydration_priority, 'normal');
    assert.equal(ctx.recommendations.best_window_today, 'tarde');
    assert.equal(ctx.alerts.length, 0);
    assert.equal(ctx.followup_hints.user_location_known, true);
    assert.equal(ctx.followup_hints.data_age_minutes, 0);
    assert.ok(ctx.followup_hints.suggested_questions.length >= 2);
    assert.equal(ctx.meta.location_source, 'zip');
    assert.equal(ctx.meta.ttl_seconds, 900);
  });

  it('handles IP fallback with low location confidence', () => {
    const ctx = buildAgentContext({
      input: { zip: null, source: 'ip_fallback' },
      location: {
        city: 'Bogotá',
        state: 'Bogotá',
        country: 'CO',
      },
      weather: {
        temperature_c: 18,
        windspeed_kmh: 10,
        condition: 'Partly Cloudy',
        observed_at: '2026-06-18T14:00',
      },
      air_quality: { aqi_us: 55, level: 'Moderate', dominant_pollutant: 'pm2_5' },
      outdoor_score: 8,
    });

    assert.equal(ctx.flags.location_confidence, 'low');
    assert.match(ctx.summary, /aproximada|puede no ser exacta/i);
    assert.equal(ctx.meta.location_source, 'ip_fallback');
    assert.ok(ctx.followup_hints.suggested_questions.some((q) => /confirm|postal|código/i.test(q)));
  });

  it('generates high air quality alert and leads summary with alert', () => {
    const ctx = buildAgentContext({
      input: { zip: '90210', source: 'zip' },
      location: { city: 'Los Angeles', state: 'California', country: 'US' },
      weather: {
        temperature_c: 28,
        windspeed_kmh: 10,
        condition: 'Clear',
        observed_at: '2026-06-18T12:00',
      },
      air_quality: { aqi_us: 168, level: 'Unhealthy', dominant_pollutant: 'pm2_5' },
      outdoor_score: 4,
    });

    assert.equal(ctx.flags.air_quality_concern, true);
    assert.equal(ctx.flags.outdoor_friendly, false);
    const airAlert = ctx.alerts.find((a) => a.type === 'air_quality');
    assert.ok(airAlert);
    assert.equal(airAlert.severity, 'high');
    assert.match(ctx.summary, /^Cuidado/);
    assert.match(ctx.summary, /Los Angeles/);
    assert.ok(ctx.recommendations.avoid_activities.length > 0);
    assert.equal(ctx.response_tone, 'cautious');
  });

  it('handles thunderstorm with critical alert', () => {
    const ctx = buildAgentContext({
      input: { zip: '80203', source: 'zip' },
      location: baseLocation,
      weather: {
        temperature_c: 20,
        windspeed_kmh: 15,
        condition: 'Thunderstorm',
        observed_at: '2026-06-18T16:00',
      },
      air_quality: denverAir,
      outdoor_score: 2,
    });

    const stormAlert = ctx.alerts.find((a) => a.type === 'severe_weather');
    assert.ok(stormAlert);
    assert.equal(stormAlert.severity, 'critical');
    assert.equal(ctx.response_tone, 'urgent');
    assert.equal(ctx.flags.outdoor_friendly, false);
    assert.ok(ctx.recommendations.avoid_activities.some((a) => /aire libre/i.test(a)));
    assert.ok(
      ctx.recommendations.suitable_activities.every((a) => /casa|interior/i.test(a)) ||
        ctx.recommendations.suitable_activities.length === 0,
    );
  });

  it('handles missing weather data gracefully', () => {
    const ctx = buildAgentContext({
      input: { zip: '80203', source: 'zip' },
      location: baseLocation,
      outdoor_score: null,
    });

    assert.match(ctx.summary, /Estás en Denver, Colorado/);
    assert.equal(typeof ctx.headline, 'string');
    assert.equal(typeof ctx.tldr, 'string');
    assert.equal(ctx.flags.outdoor_friendly, false);
  });

  it('Miami 33101: thunderstorm blocks outdoor_friendly despite moderate wind', () => {
    const ctx = buildAgentContext({
      input: { zip: '33101', source: 'zip' },
      location: { city: 'Miami', state: 'Florida', country: 'US' },
      weather: {
        temperature_c: 32.3,
        windspeed_kmh: 19.3,
        condition: 'Thunderstorm',
        observed_at: '2026-06-19T14:00',
      },
      air_quality: { aqi_us: 37, level: 'Good', dominant_pollutant: 'pm2_5' },
      outdoor_score: 4,
    });

    assert.equal(ctx.flags.outdoor_friendly, false);
    assert.equal(ctx.flags.wind_concern, false);
    assert.equal(ctx.flags.air_quality_concern, false);
    assert.equal(ctx.flags.extreme_temperature, false);
    assert.equal(ctx.flags.location_confidence, 'high');

    const stormAlert = ctx.alerts.find((a) => a.type === 'severe_weather');
    assert.ok(stormAlert);
    assert.equal(stormAlert.severity, 'critical');
    assert.equal(
      stormAlert.message,
      'Tormenta eléctrica activa. Permanece en interiores y evita espacios abiertos.',
    );

    assert.equal(ctx.headline, 'Alerta de tormenta — quédate en interiores');
    assert.equal(ctx.response_tone, 'urgent');
    assert.match(ctx.summary, /^Cuidado — Tormenta eléctrica activa/);
    assert.match(ctx.summary, /32°C/);
    assert.match(ctx.summary, /cielo cubierto con tormenta eléctrica activa/);
    assert.match(ctx.summary, /19 km\/h/);
    assert.match(ctx.summary, /AQI 37/);
    assert.equal(ctx.tldr, '32°C, con tormenta, aire limpio');

    assert.equal(ctx.recommendations.hydration_priority, 'high');
    assert.ok(ctx.recommendations.avoid_activities.some((a) => /aire libre/i.test(a)));
    assert.ok(ctx.recommendations.suitable_activities.every((a) => /casa|interior/i.test(a)));
    assert.equal(ctx.meta.location_source, 'zip');
  });

  it('Boston 02108: high wind sets wind_concern but outdoor_friendly stays true with score 9', () => {
    const ctx = buildAgentContext({
      input: { zip: '02108', source: 'zip' },
      location: { city: 'Boston', state: 'Massachusetts', country: 'US' },
      weather: {
        temperature_c: 25.5,
        windspeed_kmh: 28.5,
        condition: 'Mainly Clear',
        observed_at: '2026-06-19T14:00',
      },
      air_quality: { aqi_us: 43, level: 'Good', dominant_pollutant: 'pm2_5' },
      outdoor_score: 9,
    });

    assert.equal(ctx.flags.outdoor_friendly, true);
    assert.equal(ctx.flags.wind_concern, true);
    assert.equal(ctx.flags.needs_sunscreen, true);
    assert.equal(ctx.flags.uv_concern, true);
    assert.equal(ctx.flags.air_quality_concern, false);

    const windAlert = ctx.alerts.find((a) => a.type === 'wind');
    assert.ok(windAlert);
    assert.equal(windAlert.severity, 'medium');
    assert.equal(
      windAlert.message,
      'Viento notable. Ten precaución con actividades al aire libre.',
    );

    assert.equal(ctx.headline, 'Excelente día para salir en Boston');
    assert.equal(ctx.response_tone, 'cautious');
    assert.match(ctx.summary, /Estás en Boston, Massachusetts/);
    assert.match(ctx.summary, /26°C/);
    assert.match(ctx.summary, /cielo mayormente despejado/);
    assert.match(ctx.summary, /29 km\/h/);
    assert.match(ctx.summary, /Buenas condiciones para estar al aire libre/);
    assert.equal(ctx.tldr, '26°C, mayormente despejado, aire limpio');

    assert.ok(ctx.recommendations.suitable_activities.includes('paseo corto'));
    assert.ok(ctx.recommendations.avoid_activities.includes('ciclismo en ruta expuesta'));
    assert.equal(ctx.recommendations.hydration_priority, 'normal');
    assert.equal(ctx.meta.location_source, 'zip');
  });

  it('Dallas 75201: outdoor_score 8 yields outdoor_friendly with wind concern at 20 km/h', () => {
    const ctx = buildAgentContext({
      input: { zip: '75201', source: 'zip' },
      location: { city: 'Dallas', state: 'Texas', country: 'US' },
      weather: {
        temperature_c: 26.4,
        windspeed_kmh: 20.3,
        condition: 'Cloudy',
        observed_at: '2026-06-19T14:00',
      },
      air_quality: { aqi_us: 57, level: 'Moderate', dominant_pollutant: 'pm2_5' },
      outdoor_score: 8,
    });

    assert.equal(ctx.flags.outdoor_friendly, true);
    assert.equal(ctx.flags.wind_concern, true);
    assert.equal(ctx.flags.uv_concern, false);
    assert.equal(ctx.flags.needs_sunscreen, false);

    const windAlert = ctx.alerts.find((a) => a.type === 'wind');
    assert.ok(windAlert);
    assert.equal(windAlert.severity, 'medium');

    assert.equal(ctx.headline, 'Buen día para salir en Dallas');
    assert.match(ctx.summary, /Estás en Dallas, Texas/);
    assert.match(ctx.summary, /26°C/);
    assert.match(ctx.summary, /cielo nublado/);
    assert.match(ctx.summary, /20 km\/h/);
    assert.match(ctx.summary, /moderada \(AQI 57\)/);
    assert.match(ctx.summary, /Buenas condiciones para estar al aire libre/);
    assert.equal(ctx.tldr, '26°C, nublado, aire moderado');

    assert.deepEqual(ctx.recommendations.suitable_activities, [
      'caminata tranquila',
      'mandados a pie',
      'café con terraza',
    ]);
    assert.ok(ctx.recommendations.avoid_activities.includes('ciclismo en ruta expuesta'));
    assert.equal(ctx.recommendations.hydration_priority, 'normal');
    assert.equal(ctx.response_tone, 'cautious');
    assert.equal(ctx.meta.location_source, 'zip');
  });

  it('San Francisco-like 24 km/h wind triggers wind_concern without blocking outdoor', () => {
    const ctx = buildAgentContext({
      input: { zip: '94102', source: 'zip' },
      location: { city: 'San Francisco', state: 'California', country: 'US' },
      weather: {
        temperature_c: 18,
        windspeed_kmh: 24.2,
        condition: 'Clear',
        observed_at: '2026-06-19T14:00',
      },
      air_quality: { aqi_us: 38, level: 'Good', dominant_pollutant: 'pm2_5' },
      outdoor_score: 9,
    });

    assert.equal(ctx.flags.wind_concern, true);
    assert.equal(ctx.flags.uv_concern, true);
    assert.equal(ctx.flags.needs_sunscreen, true);
    assert.ok(ctx.alerts.some((a) => a.type === 'wind'));
    assert.equal(ctx.flags.outdoor_friendly, true);
  });

  it('uv_concern true always implies needs_sunscreen true', () => {
    const ctx = buildAgentContext({
      input: { zip: '02108', source: 'zip' },
      location: { city: 'Boston', state: 'Massachusetts', country: 'US' },
      weather: {
        temperature_c: 25,
        windspeed_kmh: 10,
        condition: 'Mainly Clear',
        observed_at: '2026-06-19T14:00',
      },
      air_quality: { aqi_us: 43, level: 'Good', dominant_pollutant: 'pm2_5' },
      outdoor_score: 10,
    });

    if (ctx.flags.uv_concern) {
      assert.equal(ctx.flags.needs_sunscreen, true);
    }
    assert.equal(ctx.flags.uv_concern, true);
    assert.equal(ctx.flags.needs_sunscreen, true);
  });

  it('score 10 without alerts yields Excelente headline and friendly tone', () => {
    const ctx = buildAgentContext({
      input: { zip: '10001', source: 'zip' },
      location: { city: 'New York City', state: 'New York', country: 'US' },
      weather: {
        temperature_c: 22,
        windspeed_kmh: 12,
        condition: 'Clear',
        observed_at: '2026-06-19T14:00',
      },
      air_quality: { aqi_us: 42, level: 'Good', dominant_pollutant: 'pm2_5' },
      outdoor_score: 10,
    });

    assert.equal(ctx.headline, 'Excelente día para salir en New York City');
    assert.equal(ctx.response_tone, 'friendly');
    assert.equal(ctx.alerts.length, 0);
  });

  it('heat alert medium for 32°C does not set extreme_temperature', () => {
    const ctx = buildAgentContext({
      input: { zip: '33139', source: 'zip' },
      location: { city: 'Miami Beach', state: 'Florida', country: 'US' },
      weather: {
        temperature_c: 32,
        windspeed_kmh: 10,
        condition: 'Clear',
        observed_at: '2026-06-19T14:00',
      },
      air_quality: { aqi_us: 37, level: 'Good', dominant_pollutant: 'pm2_5' },
      outdoor_score: 9,
    });

    const heat = ctx.alerts.find((a) => a.type === 'heat');
    assert.ok(heat);
    assert.equal(heat.severity, 'medium');
    assert.equal(ctx.flags.extreme_temperature, false);
    assert.equal(ctx.headline, 'Excelente día para salir en Miami Beach');
    assert.equal(ctx.response_tone, 'cautious');
  });

  it('extreme_temp high at 36°C not heat alert', () => {
    const ctx = buildAgentContext({
      input: { zip: '85001', source: 'zip' },
      location: { city: 'Phoenix', state: 'Arizona', country: 'US' },
      weather: {
        temperature_c: 36,
        windspeed_kmh: 8,
        condition: 'Clear',
        observed_at: '2026-06-19T14:00',
      },
      air_quality: { aqi_us: 40, level: 'Good', dominant_pollutant: 'pm2_5' },
      outdoor_score: 6,
    });

    assert.ok(ctx.alerts.some((a) => a.type === 'extreme_temp' && a.severity === 'high'));
    assert.equal(
      ctx.alerts.some((a) => a.type === 'heat'),
      false,
    );
    assert.equal(ctx.flags.extreme_temperature, true);
    assert.equal(ctx.headline, 'Temperatura extrema hoy');
    assert.equal(ctx.response_tone, 'cautious');
  });

  it('boundary 35°C is heat medium not extreme_temp', () => {
    const ctx = buildAgentContext({
      input: { zip: '33139', source: 'zip' },
      location: { city: 'Miami Beach', state: 'Florida', country: 'US' },
      weather: {
        temperature_c: 35,
        windspeed_kmh: 10,
        condition: 'Clear',
        observed_at: '2026-06-19T14:00',
      },
      air_quality: { aqi_us: 37, level: 'Good', dominant_pollutant: 'pm2_5' },
      outdoor_score: 8,
    });

    const heat = ctx.alerts.find((a) => a.type === 'heat');
    assert.ok(heat);
    assert.equal(
      ctx.alerts.some((a) => a.type === 'extreme_temp'),
      false,
    );
    assert.equal(ctx.flags.extreme_temperature, false);
    assert.equal(ctx.response_tone, 'cautious');
  });

  it('score below 6 without alerts is informative tone', () => {
    const ctx = buildAgentContext({
      input: { zip: '80203', source: 'zip' },
      location: baseLocation,
      weather: {
        temperature_c: 20,
        windspeed_kmh: 10,
        condition: 'Partly Cloudy',
        observed_at: '2026-06-19T14:00',
      },
      air_quality: denverAir,
      outdoor_score: 5,
    });

    assert.equal(ctx.response_tone, 'informative');
    assert.equal(ctx.headline, 'Condiciones mixtas en Denver');
    assert.equal(ctx.alerts.length, 0);
  });
});

/**
 * Matriz de regresión v0.4.1 — 10 perfiles del review de calidad agent_context.
 * Scores esperados: NYC 10, Boston 9, Denver 9, SF 10, Dallas 6, Chicago 10, Atlanta 10, Miami 1, San Salvador IP 8.
 */
describe('v0.4.1 regression matrix', () => {
  const observedAt = '2026-06-19T14:00';

  const scoreMatrix = [
    {
      name: 'NYC ideal',
      input: { temperature_c: 22, windspeed_kmh: 12, condition: 'Clear', aqi_us: 42 },
      expected: 10,
    },
    {
      name: 'Boston windy',
      input: { temperature_c: 25.5, windspeed_kmh: 28.5, condition: 'Mainly Clear', aqi_us: 43 },
      expected: 9,
    },
    {
      name: 'Denver cool partly cloudy',
      input: { temperature_c: 14, windspeed_kmh: 18.2, condition: 'Partly Cloudy', aqi_us: 38 },
      expected: 9,
    },
    {
      name: 'SF windy clear',
      input: { temperature_c: 18, windspeed_kmh: 24.2, condition: 'Clear', aqi_us: 38 },
      expected: 10,
    },
    {
      name: 'Dallas cloudy moderate AQI',
      input: { temperature_c: 26.4, windspeed_kmh: 20.3, condition: 'Cloudy', aqi_us: 57 },
      expected: 6,
    },
    {
      name: 'Chicago moderate AQI',
      input: { temperature_c: 24, windspeed_kmh: 14, condition: 'Partly Cloudy', aqi_us: 51 },
      expected: 10,
    },
    {
      name: 'Atlanta warm',
      input: { temperature_c: 29.2, windspeed_kmh: 10, condition: 'Clear', aqi_us: 40 },
      expected: 10,
    },
    {
      name: 'Miami thunderstorm',
      input: { temperature_c: 32.3, windspeed_kmh: 19.3, condition: 'Thunderstorm', aqi_us: 37 },
      expected: 1,
    },
    {
      name: 'San Salvador IP moderate AQI',
      input: { temperature_c: 26, windspeed_kmh: 12, condition: 'Partly Cloudy', aqi_us: 77 },
      source: 'ip_fallback',
      expected: 8,
    },
  ];

  for (const row of scoreMatrix) {
    it(`outdoor_score — ${row.name} → ${row.expected}`, () => {
      const { score } = calculateOutdoorScore(row.input);
      const finalScore = finalizeOutdoorScore(score, row.source ?? 'zip');
      assert.equal(finalScore, row.expected);
    });
  }

  it('matrix has at least 4 distinct scores', () => {
    const scores = scoreMatrix.map((row) => {
      const { score } = calculateOutdoorScore(row.input);
      return finalizeOutdoorScore(score, row.source ?? 'zip');
    });
    assert.ok(new Set(scores).size >= 4);
  });

  it('no summary uses ungrammatical cielos + singular adjective', () => {
    const contexts = scoreMatrix.map((row) =>
      buildAgentContext({
        input: { zip: '00000', source: row.source ?? 'zip' },
        location: { city: 'Test', state: 'TS', country: 'US' },
        weather: {
          temperature_c: row.input.temperature_c,
          windspeed_kmh: row.input.windspeed_kmh,
          condition: row.input.condition,
          observed_at: observedAt,
        },
        air_quality: {
          aqi_us: row.input.aqi_us,
          level: 'Good',
          dominant_pollutant: 'pm2_5',
        },
        outdoor_score: finalizeOutdoorScore(
          calculateOutdoorScore(row.input).score,
          row.source ?? 'zip',
        ),
      }),
    );

    for (const ctx of contexts) {
      assert.doesNotMatch(ctx.summary, /cielos (despejado|nublado|parcialmente nublado)/);
      if (ctx.flags.uv_concern) {
        assert.equal(ctx.flags.needs_sunscreen, true);
      }
    }
  });

  it('at least 3 distinct suitable_activities profiles', () => {
    const profiles = [
      buildAgentContext({
        input: { zip: '10001', source: 'zip' },
        location: { city: 'NYC', state: 'NY', country: 'US' },
        weather: {
          temperature_c: 22,
          windspeed_kmh: 12,
          condition: 'Clear',
          observed_at: observedAt,
        },
        air_quality: { aqi_us: 42, level: 'Good', dominant_pollutant: 'pm2_5' },
        outdoor_score: 10,
      }),
      buildAgentContext({
        input: { zip: '75201', source: 'zip' },
        location: { city: 'Dallas', state: 'TX', country: 'US' },
        weather: {
          temperature_c: 26.4,
          windspeed_kmh: 20.3,
          condition: 'Cloudy',
          observed_at: observedAt,
        },
        air_quality: { aqi_us: 57, level: 'Moderate', dominant_pollutant: 'pm2_5' },
        outdoor_score: 8,
      }),
      buildAgentContext({
        input: { zip: '33101', source: 'zip' },
        location: { city: 'Miami', state: 'FL', country: 'US' },
        weather: {
          temperature_c: 32.3,
          windspeed_kmh: 19.3,
          condition: 'Thunderstorm',
          observed_at: observedAt,
        },
        air_quality: { aqi_us: 37, level: 'Good', dominant_pollutant: 'pm2_5' },
        outdoor_score: 2,
      }),
      buildAgentContext({
        input: { zip: '80203', source: 'zip' },
        location: { city: 'Denver', state: 'CO', country: 'US' },
        weather: {
          temperature_c: 14,
          windspeed_kmh: 18.2,
          condition: 'Partly Cloudy',
          observed_at: observedAt,
        },
        air_quality: { aqi_us: 38, level: 'Good', dominant_pollutant: 'pm2_5' },
        outdoor_score: 9,
      }),
    ].map((ctx) => ctx.recommendations.suitable_activities.join('|'));

    assert.ok(new Set(profiles).size >= 3);
  });
});
