import { z } from 'zod';

const finiteNumber = z.number().finite();

export const ZippopotamPlaceSchema = z.object({
  'place name': z.string().min(1),
  state: z.string().min(1),
  latitude: z.union([z.string(), finiteNumber]),
  longitude: z.union([z.string(), finiteNumber]),
});

export const ZippopotamResponseSchema = z.object({
  'country abbreviation': z.string().optional(),
  places: z.array(ZippopotamPlaceSchema).min(1),
});

export const OpenMeteoForecastCurrentSchema = z.object({
  temperature_2m: finiteNumber,
  wind_speed_10m: finiteNumber,
  weather_code: finiteNumber,
  time: z.string().min(1),
});

export const OpenMeteoForecastResponseSchema = z.object({
  current: OpenMeteoForecastCurrentSchema,
});

export const OpenMeteoAirQualityCurrentSchema = z.object({
  us_aqi: finiteNumber,
  pm2_5: finiteNumber.optional(),
  pm10: finiteNumber.optional(),
  ozone: finiteNumber.optional(),
  nitrogen_dioxide: finiteNumber.optional(),
});

export const OpenMeteoAirQualityResponseSchema = z.object({
  current: OpenMeteoAirQualityCurrentSchema,
});

export const IpApiResponseSchema = z.object({
  status: z.string(),
  message: z.string().optional(),
  city: z.string().min(1),
  regionName: z.string().min(1),
  countryCode: z.string().min(1),
  lat: finiteNumber,
  lon: finiteNumber,
});

/**
 * @param {unknown} data
 * @returns {z.infer<typeof ZippopotamResponseSchema>}
 */
export function parseZippopotamResponse(data) {
  const result = ZippopotamResponseSchema.safeParse(data);
  if (!result.success) {
    const error = new Error('Invalid zippopotam response');
    error.code = 'LOCATION_NOT_FOUND';
    throw error;
  }
  return result.data;
}

/**
 * @param {unknown} data
 * @returns {z.infer<typeof OpenMeteoForecastCurrentSchema>}
 */
export function parseOpenMeteoForecast(data) {
  const result = OpenMeteoForecastResponseSchema.safeParse(data);
  if (!result.success) {
    const error = new Error('Weather data unavailable');
    error.code = 'WEATHER_UNAVAILABLE';
    throw error;
  }
  return result.data.current;
}

/**
 * @param {unknown} data
 * @returns {z.infer<typeof OpenMeteoAirQualityCurrentSchema>}
 */
export function parseOpenMeteoAirQuality(data) {
  const result = OpenMeteoAirQualityResponseSchema.safeParse(data);
  if (!result.success) {
    const error = new Error('Air quality data unavailable');
    error.code = 'AIR_QUALITY_UNAVAILABLE';
    throw error;
  }
  return result.data.current;
}

/**
 * @param {unknown} data
 * @returns {z.infer<typeof IpApiResponseSchema>}
 */
export function parseIpApiResponse(data) {
  if (typeof data === 'object' && data !== null && 'status' in data && data.status !== 'success') {
    const message =
      typeof data.message === 'string' && data.message.length > 0
        ? data.message
        : 'IP geolocation failed';
    const error = new Error(message);
    error.code = 'LOCATION_NOT_FOUND';
    throw error;
  }

  const result = IpApiResponseSchema.safeParse(data);
  if (!result.success) {
    const error = new Error('IP geolocation failed');
    error.code = 'LOCATION_NOT_FOUND';
    throw error;
  }
  return result.data;
}
