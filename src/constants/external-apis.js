/**
 * Stable public API endpoints from PRD §4 and prueba técnica §2.
 * Not env-configurable — use config.js only for providers with runtime overrides (ip-api, LLM).
 */

export const OPEN_METEO_FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
export const OPEN_METEO_FORECAST_CURRENT = 'temperature_2m,weather_code,wind_speed_10m';

export const OPEN_METEO_AIR_QUALITY_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';
export const OPEN_METEO_AIR_QUALITY_CURRENT = 'us_aqi,pm2_5,pm10,ozone,nitrogen_dioxide';

export const ZIPPOPOTAM_BASE_URL = 'https://api.zippopotam.us';

/**
 * @param {string} zip
 * @returns {string}
 */
export function zippopotamZipUrl(zip) {
  return `${ZIPPOPOTAM_BASE_URL}/us/${zip}`;
}
