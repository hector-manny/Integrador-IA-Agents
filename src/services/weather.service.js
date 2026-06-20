import {
  OPEN_METEO_FORECAST_CURRENT,
  OPEN_METEO_FORECAST_URL,
} from '../constants/external-apis.js';
import { mapWeatherCode } from '../logic/weather-mapper.js';
import { parseOpenMeteoForecast } from '../models/external-api.schemas.js';
import { createHttpClient } from './http-client.js';
import { cacheService, buildKey } from './cache.service.js';

/**
 * L1 cache: raw Open-Meteo forecast payload keyed by coordinates.
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<{ temperature_c: number, windspeed_kmh: number, condition: string }>}
 */
export async function getWeather(lat, lon) {
  const cacheKey = buildKey('weather', String(lat), String(lon));
  const cached = cacheService.get(cacheKey);
  if (cached) {
    return cached;
  }

  const http = createHttpClient();
  const response = await http.get(OPEN_METEO_FORECAST_URL, {
    params: {
      latitude: lat,
      longitude: lon,
      current: OPEN_METEO_FORECAST_CURRENT,
      timezone: 'auto',
    },
  });

  const current = parseOpenMeteoForecast(response.data);
  const weather = {
    temperature_c: current.temperature_2m,
    windspeed_kmh: current.wind_speed_10m,
    condition: mapWeatherCode(current.weather_code),
    observed_at: current.time,
  };

  cacheService.set(cacheKey, weather);
  return weather;
}
