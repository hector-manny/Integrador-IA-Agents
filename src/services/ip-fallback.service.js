import { parseIpApiResponse } from '../models/external-api.schemas.js';
import { createHttpClient } from './http-client.js';
import { getConfig } from '../config.js';

/**
 * @returns {Promise<{ city: string, state: string, country: string, lat: number, lon: number }>}
 */
export async function resolveByIp() {
  const { ipApiBaseUrl } = getConfig();
  const baseUrl = ipApiBaseUrl.replace(/\/$/, '');
  const http = createHttpClient();
  const response = await http.get(`${baseUrl}/json`, {
    params: {
      fields: 'status,message,city,regionName,countryCode,lat,lon',
    },
  });

  const data = parseIpApiResponse(response.data);

  return {
    city: data.city,
    state: data.regionName,
    country: data.countryCode,
    lat: data.lat,
    lon: data.lon,
  };
}
