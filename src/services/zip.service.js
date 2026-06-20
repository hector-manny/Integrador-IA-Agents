import { zippopotamZipUrl } from '../constants/external-apis.js';
import { parseZippopotamResponse } from '../models/external-api.schemas.js';
import { createHttpClient } from './http-client.js';
import { cacheService, buildKey } from './cache.service.js';

/**
 * @param {string | number} value
 * @returns {number}
 */
function toFiniteCoordinate(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    const error = new Error('Invalid coordinates in zippopotam response');
    error.code = 'LOCATION_NOT_FOUND';
    throw error;
  }
  return parsed;
}

/**
 * @param {string} zip
 * @returns {Promise<{ city: string, state: string, country: string, lat: number, lon: number }>}
 */
export async function resolveZip(zip) {
  const cacheKey = buildKey('zip', zip);
  const cached = cacheService.get(cacheKey);
  if (cached) {
    return cached;
  }

  const http = createHttpClient();
  const response = await http.get(zippopotamZipUrl(zip));
  const data = parseZippopotamResponse(response.data);
  const place = data.places[0];

  const location = {
    city: place['place name'],
    state: place.state,
    country: data['country abbreviation'] ?? 'US',
    lat: toFiniteCoordinate(place.latitude),
    lon: toFiniteCoordinate(place.longitude),
  };

  cacheService.set(cacheKey, location);
  return location;
}
