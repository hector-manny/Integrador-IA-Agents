import {
  OPEN_METEO_AIR_QUALITY_CURRENT,
  OPEN_METEO_AIR_QUALITY_URL,
} from '../constants/external-apis.js';
import { aqiToLevel, dominantPollutant } from '../logic/air-quality-mapper.js';
import { parseOpenMeteoAirQuality } from '../models/external-api.schemas.js';
import { createHttpClient } from './http-client.js';
import { cacheService, buildKey } from './cache.service.js';

/**
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<{ aqi_us: number, level: string, dominant_pollutant: string }>}
 */
export async function getAirQuality(lat, lon) {
  const cacheKey = buildKey('air', String(lat), String(lon));
  const cached = cacheService.get(cacheKey);
  if (cached) {
    return cached;
  }

  const http = createHttpClient();
  const response = await http.get(OPEN_METEO_AIR_QUALITY_URL, {
    params: {
      latitude: lat,
      longitude: lon,
      current: OPEN_METEO_AIR_QUALITY_CURRENT,
    },
  });

  const current = parseOpenMeteoAirQuality(response.data);
  const airQuality = {
    aqi_us: current.us_aqi,
    level: aqiToLevel(current.us_aqi),
    dominant_pollutant: dominantPollutant({
      pm2_5: current.pm2_5,
      pm10: current.pm10,
      ozone: current.ozone,
      nitrogen_dioxide: current.nitrogen_dioxide,
    }),
  };

  cacheService.set(cacheKey, airQuality);
  return airQuality;
}
