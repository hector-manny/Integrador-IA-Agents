const WMO_MAP = {
  0: 'Clear',
  1: 'Mainly Clear',
  2: 'Partly Cloudy',
  3: 'Cloudy',
  45: 'Foggy',
  48: 'Foggy',
  51: 'Light Rain',
  53: 'Light Rain',
  55: 'Moderate Rain',
  61: 'Rainy',
  63: 'Rainy',
  65: 'Heavy Rain',
  71: 'Snowy',
  73: 'Snowy',
  75: 'Heavy Snow',
  80: 'Rain Showers',
  81: 'Rain Showers',
  82: 'Heavy Rain Showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm',
  99: 'Severe Thunderstorm',
};

/**
 * @param {number} code
 * @returns {string}
 */
export function mapWeatherCode(code) {
  if (Object.prototype.hasOwnProperty.call(WMO_MAP, code)) {
    return WMO_MAP[code];
  }
  return 'Unknown';
}

export { WMO_MAP };
