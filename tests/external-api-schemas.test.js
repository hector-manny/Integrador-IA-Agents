import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseIpApiResponse,
  parseOpenMeteoAirQuality,
  parseOpenMeteoForecast,
  parseZippopotamResponse,
} from '../src/models/external-api.schemas.js';

describe('external-api.schemas', () => {
  it('parseZippopotamResponse accepts valid payload', () => {
    const data = parseZippopotamResponse({
      'country abbreviation': 'US',
      places: [
        {
          'place name': 'Denver',
          state: 'Colorado',
          latitude: '39.7392',
          longitude: '-104.9903',
        },
      ],
    });
    assert.equal(data.places[0]['place name'], 'Denver');
  });

  it('parseZippopotamResponse rejects empty places', () => {
    assert.throws(() => parseZippopotamResponse({ places: [] }), /Invalid zippopotam/);
  });

  it('parseOpenMeteoForecast rejects missing current', () => {
    assert.throws(() => parseOpenMeteoForecast({}), /Weather data unavailable/);
  });

  it('parseOpenMeteoForecast rejects NaN temperature', () => {
    assert.throws(
      () =>
        parseOpenMeteoForecast({
          current: {
            temperature_2m: NaN,
            wind_speed_10m: 10,
            weather_code: 0,
            time: '2026-06-18T12:00',
          },
        }),
      /Weather data unavailable/,
    );
  });

  it('parseOpenMeteoAirQuality accepts valid current', () => {
    const current = parseOpenMeteoAirQuality({
      current: { us_aqi: 42, pm2_5: 12, ozone: 30 },
    });
    assert.equal(current.us_aqi, 42);
  });

  it('parseIpApiResponse rejects failed status', () => {
    assert.throws(
      () => parseIpApiResponse({ status: 'fail', message: 'invalid query' }),
      /invalid query/,
    );
  });

  it('parseIpApiResponse accepts success payload', () => {
    const data = parseIpApiResponse({
      status: 'success',
      city: 'Denver',
      regionName: 'Colorado',
      countryCode: 'US',
      lat: 39.74,
      lon: -104.99,
    });
    assert.equal(data.city, 'Denver');
  });
});
