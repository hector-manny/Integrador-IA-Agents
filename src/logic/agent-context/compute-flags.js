import { WIND_CONCERN_MIN } from '../thresholds.js';
import { hasCriticalAlert } from './detect-alerts.js';
import { isDaytime, isMidday } from './time-utils.js';
import { isRainCondition } from './weather-conditions.js';

/**
 * @param {{
 *   weather?: { temperature_c?: number, windspeed_kmh?: number, condition?: string, observed_at?: string } | null,
 *   air_quality?: { aqi_us?: number } | null,
 *   outdoor_score?: number | null,
 *   source: 'zip' | 'ip_fallback',
 *   alerts: Array<{ severity: string }>,
 * }} params
 */
export function computeFlags({ weather, air_quality, outdoor_score, source, alerts }) {
  const temp = weather?.temperature_c;
  const wind = weather?.windspeed_kmh;
  const condition = weather?.condition;
  const aqi = air_quality?.aqi_us;
  const observedAt = weather?.observed_at;
  const isClearSky = condition === 'Clear' || condition === 'Mainly Clear';

  return {
    outdoor_friendly: (outdoor_score ?? 0) >= 6 && !hasCriticalAlert(alerts),
    needs_jacket: temp !== undefined && temp < 18,
    needs_umbrella: isRainCondition(condition),
    needs_sunscreen: isClearSky && isDaytime(observedAt),
    uv_concern: isClearSky && isMidday(observedAt),
    air_quality_concern: aqi !== undefined && aqi > 100,
    wind_concern: wind !== undefined && wind >= WIND_CONCERN_MIN,
    extreme_temperature: temp !== undefined && (temp < 0 || temp > 35),
    location_confidence: source === 'zip' ? 'high' : 'low',
  };
}
