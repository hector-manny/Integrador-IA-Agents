import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AgentContextSchema, ErrorCodeSchema, LocationSchema } from '../src/models/schemas.js';

describe('AgentContextSchema', () => {
  const validContext = {
    summary: 'Estás en Denver, Colorado. Buenas condiciones para estar al aire libre.',
    headline: 'Buen día para salir en Denver',
    tldr: '14°C, parcialmente nublado, aire limpio',
    response_tone: 'friendly',
    flags: {
      outdoor_friendly: true,
      needs_jacket: true,
      needs_umbrella: false,
      needs_sunscreen: false,
      uv_concern: false,
      air_quality_concern: false,
      wind_concern: false,
      extreme_temperature: false,
      location_confidence: 'high',
    },
    recommendations: {
      clothing: 'Chaqueta o suéter ligero',
      suitable_activities: ['caminar', 'correr'],
      avoid_activities: [],
      hydration_priority: 'normal',
      best_window_today: 'tarde',
    },
    alerts: [],
    followup_hints: {
      user_location_known: true,
      data_age_minutes: 0,
      suggested_questions: ['¿Quieres el pronóstico de las próximas horas?'],
    },
    meta: {
      generated_at: '2026-06-18T15:42:00-06:00',
      location_source: 'zip',
      ttl_seconds: 900,
    },
  };

  it('accepts valid structured agent_context', () => {
    const result = AgentContextSchema.safeParse(validContext);
    assert.equal(result.success, true);
  });

  it('rejects missing response_tone', () => {
    const incomplete = { ...validContext };
    delete incomplete.response_tone;
    const result = AgentContextSchema.safeParse(incomplete);
    assert.equal(result.success, false);
  });

  it('rejects missing headline', () => {
    const incomplete = { ...validContext };
    delete incomplete.headline;
    const result = AgentContextSchema.safeParse(incomplete);
    assert.equal(result.success, false);
  });

  it('LocationSchema rejects NaN coordinates', () => {
    const result = LocationSchema.safeParse({
      city: 'Denver',
      state: 'Colorado',
      country: 'US',
      lat: NaN,
      lon: -104.99,
    });
    assert.equal(result.success, false);
  });

  it('ErrorCodeSchema excludes INVALID_PARAMETER', () => {
    assert.equal(ErrorCodeSchema.safeParse('INVALID_PARAMETER').success, false);
    assert.equal(ErrorCodeSchema.safeParse('INVALID_ZIP').success, true);
  });
});
