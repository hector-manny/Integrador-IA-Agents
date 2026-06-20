/**
 * @param {{
 *   source: 'zip' | 'ip_fallback',
 *   location: { city: string },
 *   dataAgeMinutes: number,
 *   flags: { air_quality_concern: boolean, outdoor_friendly: boolean },
 * }} params
 */
export function buildFollowupHints({ source, location, dataAgeMinutes, flags }) {
  /** @type {string[]} */
  const suggested_questions = [
    '¿Quieres el pronóstico de las próximas horas?',
    `¿Te recomiendo actividades específicas en ${location.city}?`,
  ];

  if (flags.air_quality_concern) {
    suggested_questions.push('¿Quieres ver cómo está el aire comparado con ayer?');
  } else {
    suggested_questions.push('¿Necesitas recomendaciones de ropa para hoy?');
  }

  if (source === 'ip_fallback') {
    suggested_questions.unshift('¿Puedes confirmarme tu ciudad o código postal?');
  }

  if (!flags.outdoor_friendly) {
    suggested_questions.push('¿Prefieres ideas de actividades en interiores?');
  }

  return {
    user_location_known: true,
    data_age_minutes: dataAgeMinutes,
    suggested_questions: [...new Set(suggested_questions)].slice(0, 4),
  };
}

/**
 * @param {{
 *   source: 'zip' | 'ip_fallback',
 *   generatedAt: string,
 *   ttlSeconds: number,
 * }} params
 */
export function buildMeta({ source, generatedAt, ttlSeconds }) {
  return {
    generated_at: generatedAt,
    location_source: source,
    ttl_seconds: ttlSeconds,
  };
}
