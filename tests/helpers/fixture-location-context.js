/**
 * @param {string} zip
 */
export function buildFixtureLocationContext(zip) {
  return {
    input: { zip, source: 'zip' },
    location: {
      city: 'Test City',
      state: 'Test State',
      country: 'US',
      lat: 39.7392,
      lon: -104.9903,
    },
    weather: {
      temperature_c: 20,
      windspeed_kmh: 10,
      condition: 'Clear',
      observed_at: '2026-06-18T14:00',
    },
    air_quality: {
      aqi_us: 42,
      level: 'Good',
      dominant_pollutant: 'pm2_5',
    },
    outdoor_score: 8,
    agent_context: {
      summary:
        'Estás en Test City, Test State. Son las 2:00 PM, hace 20°C con cielo despejado y viento bajo de 10 km/h. La calidad del aire es buena (AQI 42). Buenas condiciones para estar al aire libre.',
      headline: 'Buen día para salir en Test City',
      tldr: '20°C, despejado, aire limpio',
      response_tone: 'friendly',
      flags: {
        outdoor_friendly: true,
        needs_jacket: false,
        needs_umbrella: false,
        needs_sunscreen: true,
        uv_concern: false,
        air_quality_concern: false,
        wind_concern: false,
        extreme_temperature: false,
        location_confidence: 'high',
      },
      recommendations: {
        clothing: 'Ropa cómoda, capa ligera opcional',
        suitable_activities: ['caminar', 'correr', 'ciclismo', 'ir a un parque'],
        avoid_activities: [],
        hydration_priority: 'normal',
        best_window_today: 'tarde',
      },
      alerts: [],
      followup_hints: {
        user_location_known: true,
        data_age_minutes: 0,
        suggested_questions: [
          '¿Quieres el pronóstico de las próximas horas?',
          '¿Te recomiendo actividades específicas en Test City?',
        ],
      },
      meta: {
        generated_at: '2026-06-18T14:00:00-06:00',
        location_source: 'zip',
        ttl_seconds: 900,
      },
    },
  };
}
