import { conditionLabelEs, formatAqiPhraseEs } from './labels.js';

/**
 * @param {{
 *   weather?: { temperature_c?: number, condition?: string } | null,
 *   air_quality?: { aqi_us?: number } | null,
 * }} params
 * @returns {string}
 */
export function composeTldr({ weather, air_quality }) {
  const parts = [];

  if (weather?.temperature_c !== undefined) {
    parts.push(`${Math.round(weather.temperature_c)}°C`);
  }

  if (weather?.condition) {
    parts.push(conditionLabelEs(weather.condition));
  }

  if (air_quality?.aqi_us !== undefined) {
    parts.push(formatAqiPhraseEs(air_quality.aqi_us));
  }

  if (parts.length === 0) {
    return 'datos limitados disponibles';
  }

  return parts.join(', ');
}
