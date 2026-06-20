/**
 * Pure air-quality domain mapping (no HTTP).
 */

/**
 * @param {number} aqiUs
 * @returns {string}
 */
export function aqiToLevel(aqiUs) {
  if (aqiUs <= 50) return 'Good';
  if (aqiUs <= 100) return 'Moderate';
  if (aqiUs <= 150) return 'Unhealthy for Sensitive Groups';
  if (aqiUs <= 200) return 'Unhealthy';
  if (aqiUs <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}

/** Open-Meteo field names → canonical pollutant keys */
const POLLUTANT_KEY_MAP = {
  pm2_5: 'pm2_5',
  pm10: 'pm10',
  ozone: 'o3',
  nitrogen_dioxide: 'no2',
};

/**
 * @param {string} openMeteoKey
 * @returns {string}
 */
export function normalizePollutantKey(openMeteoKey) {
  return POLLUTANT_KEY_MAP[openMeteoKey] ?? openMeteoKey;
}

/**
 * @param {{ pm2_5?: number, pm10?: number, ozone?: number, nitrogen_dioxide?: number }} pollutants
 * @returns {string}
 */
export function dominantPollutant(pollutants) {
  const entries = [
    ['pm2_5', pollutants.pm2_5],
    ['pm10', pollutants.pm10],
    ['ozone', pollutants.ozone],
    ['nitrogen_dioxide', pollutants.nitrogen_dioxide],
  ].filter(([, value]) => value !== undefined && value !== null);

  if (entries.length === 0) {
    return 'unknown';
  }

  entries.sort((a, b) => Number(b[1]) - Number(a[1]));
  return normalizePollutantKey(entries[0][0]);
}
