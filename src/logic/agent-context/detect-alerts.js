import { WIND_ALERT_HIGH_MIN, WIND_ALERT_MEDIUM_MIN } from '../thresholds.js';
import { isSnowCondition, isStormCondition } from './weather-conditions.js';

const SEVERITY_ORDER = { critical: 4, high: 3, medium: 2, low: 1 };

/**
 * @param {Array<{ severity: string }>} alerts
 * @returns {boolean}
 */
export function hasCriticalAlert(alerts) {
  return alerts.some((alert) => alert.severity === 'critical');
}

/**
 * @param {Array<{ severity: string, message: string, type: string, affects?: string[] }>} alerts
 * @returns {{ severity: string, message: string, type: string, affects?: string[] } | null}
 */
export function getMostSevereAlert(alerts) {
  if (alerts.length === 0) {
    return null;
  }
  return alerts.reduce((best, current) => {
    const bestRank = SEVERITY_ORDER[best.severity] ?? 0;
    const currentRank = SEVERITY_ORDER[current.severity] ?? 0;
    return currentRank > bestRank ? current : best;
  });
}

/**
 * @param {{
 *   weather?: { temperature_c?: number, windspeed_kmh?: number, condition?: string } | null,
 *   air_quality?: { aqi_us?: number } | null,
 * }} params
 * @returns {Array<{ severity: 'low' | 'medium' | 'high' | 'critical', type: string, message: string, affects?: string[] }>}
 */
export function detectAlerts({ weather, air_quality }) {
  /** @type {Array<{ severity: 'low' | 'medium' | 'high' | 'critical', type: string, message: string, affects?: string[] }>} */
  const alerts = [];

  const aqi = air_quality?.aqi_us;
  if (aqi !== undefined) {
    if (aqi > 150) {
      alerts.push({
        severity: 'high',
        type: 'air_quality',
        message: 'Calidad del aire poco saludable. Evita ejercicio prolongado al aire libre.',
        affects: ['respiratory_sensitive', 'children', 'elderly'],
      });
    } else if (aqi > 100) {
      alerts.push({
        severity: 'medium',
        type: 'air_quality',
        message:
          'Calidad del aire moderada a insalubre para grupos sensibles. Considera limitar actividades intensas al exterior.',
        affects: ['respiratory_sensitive', 'children', 'elderly'],
      });
    }
  }

  const temp = weather?.temperature_c;
  if (temp !== undefined && temp < 0) {
    alerts.push({
      severity: 'high',
      type: 'extreme_temp',
      message:
        'Temperatura bajo cero. Protégete del frío extremo y limita la exposición prolongada.',
      affects: ['elderly'],
    });
  } else if (temp !== undefined && temp > 35) {
    alerts.push({
      severity: 'high',
      type: 'extreme_temp',
      message: 'Calor extremo. Mantente hidratado y evita esfuerzo intenso al aire libre.',
      affects: ['children', 'elderly'],
    });
  } else if (temp !== undefined && temp >= 30 && temp <= 35) {
    alerts.push({
      severity: 'medium',
      type: 'heat',
      message: 'Calor elevado. Mantente hidratado y busca sombra en actividades al aire libre.',
      affects: ['children', 'elderly'],
    });
  }

  const wind = weather?.windspeed_kmh;
  if (wind !== undefined) {
    if (wind >= WIND_ALERT_HIGH_MIN) {
      alerts.push({
        severity: 'high',
        type: 'wind',
        message: 'Viento muy fuerte. Evita actividades al aire libre expuestas al viento.',
      });
    } else if (wind >= WIND_ALERT_MEDIUM_MIN) {
      alerts.push({
        severity: 'medium',
        type: 'wind',
        message: 'Viento notable. Ten precaución con actividades al aire libre.',
      });
    }
  }

  const condition = weather?.condition;
  if (isStormCondition(condition)) {
    alerts.push({
      severity: 'critical',
      type: 'severe_weather',
      message: 'Tormenta eléctrica activa. Permanece en interiores y evita espacios abiertos.',
    });
  } else if (isSnowCondition(condition)) {
    alerts.push({
      severity: 'medium',
      type: 'winter_weather',
      message: 'Nieve en la zona. Conduce con precaución y viste abrigo adecuado.',
    });
  }

  return alerts;
}
