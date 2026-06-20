import { getMostSevereAlert } from './detect-alerts.js';

/**
 * @param {{
 *   outdoor_score?: number | null,
 *   alerts: Array<{ severity: string, type: string }>,
 *   location: { city: string },
 *   flags: { outdoor_friendly: boolean, air_quality_concern: boolean },
 *   weather?: { condition?: string } | null,
 * }} params
 * @returns {string}
 */
export function composeHeadline({ outdoor_score, alerts, location, flags, weather }) {
  const topAlert = getMostSevereAlert(alerts);

  if (topAlert?.severity === 'critical') {
    return 'Alerta de tormenta — quédate en interiores';
  }
  if (topAlert?.type === 'air_quality' && topAlert.severity === 'high') {
    return `Alerta de aire en ${location.city}`;
  }
  if (topAlert?.type === 'extreme_temp') {
    return 'Temperatura extrema hoy';
  }
  if (weather?.condition === 'Thunderstorm' || weather?.condition === 'Severe Thunderstorm') {
    return 'Tormenta esperada esta tarde';
  }
  if (flags.outdoor_friendly && (outdoor_score ?? 0) >= 9) {
    return `Excelente día para salir en ${location.city}`;
  }
  if (flags.outdoor_friendly && (outdoor_score ?? 0) >= 6) {
    return `Buen día para salir en ${location.city}`;
  }
  if (flags.air_quality_concern) {
    return `Precaución con el aire en ${location.city}`;
  }
  return `Condiciones mixtas en ${location.city}`;
}
