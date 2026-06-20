import { AQI_MODERATE_MAX, AQI_GOOD_MAX } from '../thresholds.js';
import { deriveBestWindowToday } from './time-utils.js';
import { isRainCondition, isStormCondition } from './weather-conditions.js';

/**
 * @param {number | undefined} temp
 * @returns {string}
 */
function deriveClothing(temp) {
  if (temp === undefined) {
    return 'Ropa cómoda según cómo sientas el clima';
  }
  if (temp < 0) {
    return 'Abrigo grueso, guantes y bufanda';
  }
  if (temp < 10) {
    return 'Abrigo y capas';
  }
  if (temp < 18) {
    return 'Chaqueta o suéter ligero';
  }
  if (temp < 25) {
    return 'Ropa cómoda, capa ligera opcional';
  }
  if (temp < 30) {
    return 'Ropa ligera y fresca';
  }
  return 'Ropa muy ligera, sombrero y protección solar';
}

/**
 * @param {number | undefined} temp
 * @returns {'normal' | 'high' | 'critical'}
 */
function deriveHydrationPriority(temp) {
  if (temp === undefined) {
    return 'normal';
  }
  if (temp > 35) {
    return 'critical';
  }
  if (temp > 28) {
    return 'high';
  }
  return 'normal';
}

/**
 * @param {{
 *   temp?: number,
 *   condition?: string,
 *   aqi?: number,
 *   outdoor_score?: number | null,
 *   source?: 'zip' | 'ip_fallback',
 *   flags: { wind_concern: boolean },
 * }} params
 * @returns {string[]}
 */
function deriveOutdoorSuitableActivities({ temp, condition, aqi, outdoor_score, source, flags }) {
  if (source === 'ip_fallback') {
    return ['paseo corto', 'actividades flexibles cerca', 'café o terraza', 'mandados a pie'];
  }
  if (aqi !== undefined && aqi > AQI_GOOD_MAX && aqi <= AQI_MODERATE_MAX) {
    return ['caminata tranquila', 'mandados a pie', 'café con terraza'];
  }
  if (flags.wind_concern) {
    return ['paseo corto', 'senderismo en zona protegida', 'caminata urbana'];
  }
  if (temp !== undefined && temp >= 28 && temp <= 32) {
    return ['paseo en sombra', 'actividad ligera temprano', 'caminar'];
  }
  if (condition === 'Cloudy') {
    return ['caminata urbana', 'visita a un parque', 'caminar'];
  }
  if (condition === 'Partly Cloudy') {
    return ['caminar', 'fotografía al aire libre', 'paseo por el parque'];
  }
  if ((outdoor_score ?? 0) >= 8) {
    return ['caminar', 'correr', 'ciclismo', 'ir a un parque'];
  }
  return ['caminar', 'correr', 'ir a un parque'];
}

/**
 * @param {{
 *   weather?: { temperature_c?: number, condition?: string, observed_at?: string } | null,
 *   air_quality?: { aqi_us?: number } | null,
 *   outdoor_score?: number | null,
 *   source?: 'zip' | 'ip_fallback',
 *   flags: {
 *     outdoor_friendly: boolean,
 *     air_quality_concern: boolean,
 *     wind_concern: boolean,
 *     extreme_temperature: boolean,
 *   },
 *   alerts: Array<{ severity: string, type: string }>,
 * }} params
 */
export function deriveRecommendations({
  weather,
  air_quality,
  outdoor_score,
  source = 'zip',
  flags,
  alerts,
}) {
  const temp = weather?.temperature_c;
  const condition = weather?.condition;
  const aqi = air_quality?.aqi_us;
  const hasCritical = alerts.some((a) => a.severity === 'critical');
  const hasHighAir = alerts.some((a) => a.type === 'air_quality' && a.severity === 'high');
  const storm = isStormCondition(condition) || hasCritical;

  /** @type {string[]} */
  let suitable_activities;
  /** @type {string[]} */
  let avoid_activities;

  if (storm) {
    suitable_activities = ['leer en casa', 'ejercicio en interiores', 'trabajar desde casa'];
    avoid_activities = [
      'caminar al aire libre',
      'correr',
      'ciclismo',
      'deportes al aire libre',
      'ir a un parque',
    ];
  } else if (!flags.outdoor_friendly || hasHighAir) {
    suitable_activities = ['paseo corto', 'mandados rápidos'];
    avoid_activities = ['correr', 'ciclismo intenso', 'ejercicio prolongado al aire libre'];
    if (flags.air_quality_concern) {
      avoid_activities.push('actividades al aire libre para niños y adultos mayores');
    }
  } else if (isRainCondition(condition)) {
    suitable_activities = ['visitar un museo', 'café en interiores', 'cine'];
    avoid_activities = ['caminata larga', 'picnic', 'deportes al aire libre'];
  } else {
    suitable_activities = deriveOutdoorSuitableActivities({
      temp,
      condition,
      aqi,
      outdoor_score,
      source,
      flags,
    });
    avoid_activities = [];
    if (flags.wind_concern) {
      avoid_activities.push('ciclismo en ruta expuesta', 'deportes con pelota al aire libre');
      if (temp !== undefined && temp < 10) {
        avoid_activities.push('correr');
      }
    }
    if (temp !== undefined && temp < 10) {
      suitable_activities = suitable_activities.filter((a) => a !== 'correr');
      suitable_activities.unshift('paseo con abrigo');
    }
  }

  if (flags.extreme_temperature && temp !== undefined && temp > 35) {
    suitable_activities = ['natación en interiores', 'actividades en espacios climatizados'];
    avoid_activities = ['correr', 'senderismo', 'trabajo físico al aire libre'];
  }

  suitable_activities = [...new Set(suitable_activities)].slice(0, 5);
  avoid_activities = [...new Set(avoid_activities)].slice(0, 5);

  const bestWindow = deriveBestWindowToday(weather?.observed_at);

  return {
    clothing: deriveClothing(temp),
    suitable_activities,
    avoid_activities,
    hydration_priority: deriveHydrationPriority(temp),
    ...(bestWindow ? { best_window_today: bestWindow } : {}),
  };
}
