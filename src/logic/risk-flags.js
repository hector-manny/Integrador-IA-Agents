import {
  AQI_GOOD_MAX,
  AQI_MODERATE_MAX,
  AQI_SENSITIVE_MAX,
  AQI_UNHEALTHY_MIN,
  TEMP_COLD_RISK,
  TEMP_HOT_RISK,
  WIND_STRONG_MIN,
} from './thresholds.js';

const RAIN_CONDITIONS = new Set([
  'Light Rain',
  'Moderate Rain',
  'Rainy',
  'Heavy Rain',
  'Rain Showers',
  'Heavy Rain Showers',
]);

const STORM_CONDITIONS = new Set(['Thunderstorm', 'Severe Thunderstorm']);

const SNOW_CONDITIONS = new Set(['Snowy', 'Heavy Snow']);

/**
 * @param {{
 *   weather?: { temperature_c?: number, windspeed_kmh?: number, condition?: string } | null,
 *   air_quality?: { aqi_us?: number } | null,
 * }} params
 * @returns {string[]}
 */
export function detectRiskFlags({ weather, air_quality }) {
  /** @type {string[]} */
  const flags = [];

  if (weather?.temperature_c !== undefined && weather.temperature_c <= TEMP_COLD_RISK) {
    flags.push('cold_temperature');
  }
  if (weather?.temperature_c !== undefined && weather.temperature_c >= TEMP_HOT_RISK) {
    flags.push('high_temperature');
  }
  if (weather?.windspeed_kmh !== undefined && weather.windspeed_kmh >= WIND_STRONG_MIN) {
    flags.push('strong_wind');
  }
  if (air_quality?.aqi_us !== undefined && air_quality.aqi_us >= AQI_UNHEALTHY_MIN) {
    flags.push('poor_air_quality');
  }

  const condition = weather?.condition;
  if (condition) {
    if (STORM_CONDITIONS.has(condition)) {
      flags.push('storm_weather');
    } else if (SNOW_CONDITIONS.has(condition)) {
      flags.push('snow_weather');
    } else if (RAIN_CONDITIONS.has(condition)) {
      flags.push('rainy_weather');
    }
  }

  return flags;
}

const RISK_FLAG_LABELS = {
  cold_temperature: 'Temperatura baja',
  high_temperature: 'Temperatura alta',
  strong_wind: 'Viento moderado',
  poor_air_quality: 'Calidad del aire deficiente',
  storm_weather: 'Tormenta',
  rainy_weather: 'Lluvia',
  snow_weather: 'Nieve',
};

/**
 * @param {string[]} flags
 * @returns {string[]}
 */
export function formatRiskFlags(flags) {
  return flags.map((flag) => RISK_FLAG_LABELS[flag]).filter((label) => label !== undefined);
}

/**
 * @param {{
 *   weather?: { temperature_c?: number, windspeed_kmh?: number, condition?: string } | null,
 *   air_quality?: { aqi_us?: number } | null,
 * }} params
 * @returns {string[]}
 */
export function buildRiskFlags({ weather, air_quality }) {
  const flags = formatRiskFlags(detectRiskFlags({ weather, air_quality }));

  if (air_quality?.aqi_us !== undefined) {
    if (air_quality.aqi_us > AQI_GOOD_MAX && air_quality.aqi_us <= AQI_MODERATE_MAX) {
      if (!flags.includes('Calidad del aire moderada')) {
        flags.push('Calidad del aire moderada');
      }
    } else if (
      air_quality.aqi_us > AQI_MODERATE_MAX &&
      air_quality.aqi_us <= AQI_SENSITIVE_MAX &&
      !flags.includes('Calidad del aire insalubre para grupos sensibles')
    ) {
      flags.push('Calidad del aire insalubre para grupos sensibles');
    } else if (
      air_quality.aqi_us >= AQI_UNHEALTHY_MIN &&
      !flags.includes('Calidad del aire deficiente')
    ) {
      flags.push('Calidad del aire deficiente');
    }
  }

  return flags;
}
