const RAIN_CONDITIONS = new Set([
  'Light Rain',
  'Moderate Rain',
  'Rainy',
  'Heavy Rain',
  'Rain Showers',
  'Heavy Rain Showers',
]);

const STORM_CONDITIONS = new Set(['Thunderstorm', 'Severe Thunderstorm']);

const SNOW_CONDITIONS = new Set(['Snowy', 'Heavy Snow']);

/**
 * @param {string | undefined} condition
 * @returns {boolean}
 */
export function isRainCondition(condition) {
  return condition !== undefined && RAIN_CONDITIONS.has(condition);
}

/**
 * @param {string | undefined} condition
 * @returns {boolean}
 */
export function isStormCondition(condition) {
  return condition !== undefined && STORM_CONDITIONS.has(condition);
}

/**
 * @param {string | undefined} condition
 * @returns {boolean}
 */
export function isSnowCondition(condition) {
  return condition !== undefined && SNOW_CONDITIONS.has(condition);
}

export { RAIN_CONDITIONS, STORM_CONDITIONS, SNOW_CONDITIONS };
