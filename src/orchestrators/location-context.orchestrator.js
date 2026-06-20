import { buildAgentContext } from '../logic/agent-context.js';
import { calculateOutdoorScore, finalizeOutdoorScore } from '../logic/outdoor-score.js';
import { getConfig } from '../config.js';
import {
  ErrorResponseSchema,
  LocationContextSchema,
} from '../models/schemas.js';
import { cacheService, buildKey } from '../services/cache.service.js';
import { resolveZip } from '../services/zip.service.js';
import { getWeather } from '../services/weather.service.js';
import { getAirQuality } from '../services/air-quality.service.js';
import { resolveByIp } from '../services/ip-fallback.service.js';
import { toIsoWithOffset } from '../logic/agent-context/time-utils.js';

/**
 * @param {string} zip
 * @returns {Promise<{ location: { city: string, state: string, country: string, lat: number, lon: number }, source: 'zip' | 'ip_fallback' } | null>}
 */
async function resolveLocation(zip) {
  try {
    const location = await resolveZip(zip);
    return { location, source: 'zip' };
  } catch {
    try {
      const location = await resolveByIp();
      return { location, source: 'ip_fallback' };
    } catch {
      return null;
    }
  }
}

/**
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<{ weather: object | null, air_quality: object | null }>}
 */
async function fetchEnvironmentalData(lat, lon) {
  const [weatherResult, airResult] = await Promise.allSettled([
    getWeather(lat, lon),
    getAirQuality(lat, lon),
  ]);

  return {
    weather: weatherResult.status === 'fulfilled' ? weatherResult.value : null,
    air_quality: airResult.status === 'fulfilled' ? airResult.value : null,
  };
}

/**
 * @param {Record<string, unknown> & { _cached_at?: number }} cached
 * @returns {import('zod').infer<typeof LocationContextSchema>}
 */
function refreshCachedAgentContext(cached) {
  const cachedAt = cached._cached_at ?? Date.now();
  const dataAgeMinutes = Math.floor((Date.now() - cachedAt) / 60000);
  const config = getConfig();
  const rest = { ...cached };
  delete rest._cached_at;

  return LocationContextSchema.parse({
    ...rest,
    agent_context: buildAgentContext({
      input: rest.input,
      location: rest.location,
      weather: rest.weather,
      air_quality: rest.air_quality,
      outdoor_score: rest.outdoor_score,
      meta: {
        dataAgeMinutes,
        ttlSeconds: config.cacheTtlSeconds,
        generatedAt: rest.agent_context?.meta?.generated_at,
      },
    }),
  });
}

/**
 * @param {string} zip
 * @returns {Promise<import('zod').infer<typeof LocationContextSchema> | import('zod').infer<typeof ErrorResponseSchema>>}
 */
export async function getLocationContext(zip) {
  const cacheKey = buildKey('context', zip);

  const cached = cacheService.get(cacheKey);
  if (cached) {
    return refreshCachedAgentContext(cached);
  }

  const resolved = await resolveLocation(zip);
  if (!resolved) {
    return ErrorResponseSchema.parse({
      error: true,
      code: 'LOCATION_NOT_FOUND',
      message: 'Unable to determine location from ZIP or IP fallback',
    });
  }

  const { location, source } = resolved;
  const { weather, air_quality } = await fetchEnvironmentalData(location.lat, location.lon);

  const { score: rawScore } = calculateOutdoorScore({
    temperature_c: weather?.temperature_c,
    windspeed_kmh: weather?.windspeed_kmh,
    condition: weather?.condition,
    aqi_us: air_quality?.aqi_us,
  });
  const score = finalizeOutdoorScore(rawScore, source);

  const config = getConfig();
  const generatedAt = toIsoWithOffset(new Date());

  const context = LocationContextSchema.parse({
    input: {
      zip,
      source,
    },
    location,
    weather,
    air_quality,
    outdoor_score: score,
    agent_context: buildAgentContext({
      input: { zip, source },
      location,
      weather,
      air_quality,
      outdoor_score: score,
      meta: {
        dataAgeMinutes: 0,
        ttlSeconds: config.cacheTtlSeconds,
        generatedAt,
      },
    }),
  });

  cacheService.set(cacheKey, { ...context, _cached_at: Date.now() });
  return context;
}

/**
 * @param {string[]} zips
 * @returns {Promise<Array<import('zod').infer<typeof LocationContextSchema> | import('zod').infer<typeof ErrorResponseSchema>>>}
 */
export async function getLocationContexts(zips) {
  return Promise.all(zips.map((zip) => getLocationContext(zip)));
}
