import { describe, it } from 'node:test';

import assert from 'node:assert/strict';

import path from 'node:path';

import { fileURLToPath, pathToFileURL } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const configModule = pathToFileURL(path.join(projectRoot, 'src/config.js')).href;

const httpClientModule = pathToFileURL(path.join(projectRoot, 'src/services/http-client.js')).href;

const cacheModule = pathToFileURL(path.join(projectRoot, 'src/services/cache.service.js')).href;

const baseConfig = {
  port: 3000,

  cacheTtlSeconds: 600,

  httpTimeoutMs: 5000,

  ipApiBaseUrl: 'http://ip-api.com',
};

/** @type {Map<string, unknown>} */

const mockCache = new Map();

function mockCacheService() {
  return {
    get(key) {
      return mockCache.get(key);
    },

    set(key, value) {
      mockCache.set(key, value);
    },

    has(key) {
      return mockCache.has(key);
    },

    buildKey(type, ...parts) {
      return `${type}:${parts.join(':')}`;
    },
  };
}

describe('services isolated', () => {
  it('resolveZip caches and normalizes location', async (t) => {
    mockCache.clear();

    let getCalls = 0;

    t.mock.module(configModule, {
      exports: { getConfig: () => baseConfig },
    });

    t.mock.module(cacheModule, {
      exports: { cacheService: mockCacheService(), buildKey: mockCacheService().buildKey },
    });

    t.mock.module(httpClientModule, {
      exports: {
        createHttpClient: () => ({
          get: async () => {
            getCalls += 1;

            return {
              data: {
                'country abbreviation': 'US',

                places: [
                  {
                    'place name': 'Denver',

                    state: 'Colorado',

                    latitude: '39.7392',

                    longitude: '-104.9903',
                  },
                ],
              },
            };
          },
        }),
      },
    });

    const { resolveZip } = await import('../../src/services/zip.service.js');

    const first = await resolveZip('80203');

    const second = await resolveZip('80203');

    assert.equal(first.city, 'Denver');

    assert.equal(first.lat, 39.7392);

    assert.equal(getCalls, 1);

    assert.deepEqual(second, first);
  });

  it('resolveZip throws when ZIP not found', async (t) => {
    mockCache.clear();

    t.mock.module(configModule, {
      exports: { getConfig: () => baseConfig },
    });

    t.mock.module(cacheModule, {
      exports: { cacheService: mockCacheService(), buildKey: mockCacheService().buildKey },
    });

    t.mock.module(httpClientModule, {
      exports: {
        createHttpClient: () => ({
          get: async () => ({ data: { places: [] } }),
        }),
      },
    });

    const { resolveZip } = await import('../../src/services/zip.service.js');

    await assert.rejects(() => resolveZip('99999'), /ZIP not found/);
  });

  it('getWeather returns normalized current weather', async (t) => {
    mockCache.clear();

    t.mock.module(configModule, {
      exports: { getConfig: () => baseConfig },
    });

    t.mock.module(cacheModule, {
      exports: { cacheService: mockCacheService(), buildKey: mockCacheService().buildKey },
    });

    t.mock.module(httpClientModule, {
      exports: {
        createHttpClient: () => ({
          get: async (url) => {
            assert.match(url, /open-meteo/);

            return {
              data: {
                current: {
                  temperature_2m: 22,

                  wind_speed_10m: 10,

                  weather_code: 0,
                },
              },
            };
          },
        }),
      },
    });

    const { getWeather } = await import('../../src/services/weather.service.js');

    const weather = await getWeather(40.7, -74.0);

    assert.equal(weather.temperature_c, 22);

    assert.equal(weather.condition, 'Clear');
  });

  it('getAirQuality maps AQI and dominant pollutant', async (t) => {
    mockCache.clear();

    t.mock.module(configModule, {
      exports: { getConfig: () => baseConfig },
    });

    t.mock.module(cacheModule, {
      exports: { cacheService: mockCacheService(), buildKey: mockCacheService().buildKey },
    });

    t.mock.module(httpClientModule, {
      exports: {
        createHttpClient: () => ({
          get: async () => ({
            data: {
              current: {
                us_aqi: 59,

                pm2_5: 12,

                pm10: 8,

                ozone: 3,

                nitrogen_dioxide: 1,
              },
            },
          }),
        }),
      },
    });

    const { getAirQuality } = await import('../../src/services/air-quality.service.js');

    const air = await getAirQuality(40.7, -74.0);

    assert.equal(air.aqi_us, 59);

    assert.equal(air.level, 'Moderate');

    assert.equal(air.dominant_pollutant, 'pm2_5');
  });

  it('resolveByIp returns location on success', async (t) => {
    t.mock.module(configModule, {
      exports: { getConfig: () => baseConfig },
    });

    t.mock.module(httpClientModule, {
      exports: {
        createHttpClient: () => ({
          get: async () => ({
            data: {
              status: 'success',

              city: 'San Salvador',

              regionName: 'San Salvador',

              countryCode: 'SV',

              lat: 13.69,

              lon: -89.19,
            },
          }),
        }),
      },
    });

    const { resolveByIp } = await import('../../src/services/ip-fallback.service.js');

    const location = await resolveByIp();

    assert.equal(location.city, 'San Salvador');

    assert.equal(location.country, 'SV');
  });
});
