import {
  AQI_GOOD_SCORE_MAX,
  AQI_MODERATE_HIGH_MAX,
  AQI_MODERATE_LOW_MAX,
  AQI_SENSITIVE_MAX,
  TEMP_COOL_MIN,
  TEMP_EXTREME_HEAT,
  TEMP_FREEZING,
  TEMP_HEAT_SCORE_MAX,
  TEMP_HOT_SCORE_MAX,
  TEMP_IDEAL_RANGE,
  TEMP_WARM_SCORE_MAX,
  WIND_CALM_MAX,
  WIND_MILD_MAX,
  WIND_MODERATE_MAX,
  WIND_STRONG_MAX,
} from './thresholds.js';

const [TEMP_IDEAL_MIN, TEMP_IDEAL_MAX] = TEMP_IDEAL_RANGE;

/**
 * @param {number | undefined} temperatureC
 * @returns {number | null}
 */
function scoreTemperature(temperatureC) {
  if (temperatureC === undefined || temperatureC === null) {
    return null;
  }
  if (temperatureC >= TEMP_IDEAL_MIN && temperatureC <= TEMP_IDEAL_MAX) return 3;
  if (temperatureC >= TEMP_COOL_MIN && temperatureC < TEMP_IDEAL_MIN) return 2;
  if (temperatureC > TEMP_IDEAL_MAX && temperatureC <= TEMP_WARM_SCORE_MAX) return 1;
  if (temperatureC > TEMP_WARM_SCORE_MAX && temperatureC <= TEMP_HOT_SCORE_MAX) return 0;
  if (temperatureC > TEMP_HOT_SCORE_MAX && temperatureC <= TEMP_HEAT_SCORE_MAX) return -1;
  if (temperatureC < TEMP_FREEZING) return -3;
  if (temperatureC > TEMP_EXTREME_HEAT) return -3;
  return 0;
}

/**
 * @param {number | undefined} windspeedKmh
 * @returns {number | null}
 */
function scoreWind(windspeedKmh) {
  if (windspeedKmh === undefined || windspeedKmh === null) {
    return null;
  }
  if (windspeedKmh < WIND_CALM_MAX) return 2;
  if (windspeedKmh < WIND_MILD_MAX) return 1;
  if (windspeedKmh < WIND_MODERATE_MAX) return 0;
  if (windspeedKmh < WIND_STRONG_MAX) return -1;
  return -2;
}

/**
 * @param {string | undefined} condition
 * @returns {number | null}
 */
function scoreCondition(condition) {
  if (!condition) {
    return null;
  }

  const conditionScores = {
    Clear: 1,
    'Mainly Clear': 1,
    'Partly Cloudy': 1,
    Cloudy: 0,
    Foggy: -1,
    'Light Rain': -2,
    'Moderate Rain': -2,
    Rainy: -2,
    'Heavy Rain': -2,
    'Rain Showers': -2,
    'Heavy Rain Showers': -2,
    Snowy: -3,
    'Heavy Snow': -3,
    Thunderstorm: -4,
    'Severe Thunderstorm': -4,
    Unknown: 0,
  };

  if (Object.prototype.hasOwnProperty.call(conditionScores, condition)) {
    return conditionScores[condition];
  }
  return 0;
}

/**
 * @param {number | undefined} aqiUs
 * @returns {number | null}
 */
function scoreAqi(aqiUs) {
  if (aqiUs === undefined || aqiUs === null) {
    return null;
  }
  if (aqiUs <= AQI_GOOD_SCORE_MAX) return 1;
  if (aqiUs <= AQI_MODERATE_LOW_MAX) return 0;
  if (aqiUs <= AQI_MODERATE_HIGH_MAX) return -1;
  if (aqiUs <= AQI_SENSITIVE_MAX) return -1;
  return -3;
}

/**
 * @param {{ temperature_c?: number, windspeed_kmh?: number, condition?: string, aqi_us?: number }} params
 * @returns {{ score: number | null, explanation: string }}
 */
export function calculateOutdoorScore({ temperature_c, windspeed_kmh, condition, aqi_us }) {
  const tempScore = scoreTemperature(temperature_c);
  const windScore = scoreWind(windspeed_kmh);
  const conditionScore = scoreCondition(condition);
  const aqiScore = scoreAqi(aqi_us);

  const factors = [tempScore, windScore, conditionScore, aqiScore].filter(
    (value) => value !== null,
  );

  if (factors.length === 0) {
    return {
      score: null,
      explanation:
        'No hay datos suficientes de clima o calidad del aire para calcular el outdoor score.',
    };
  }

  const base = 5;
  const total = base + factors.reduce((sum, value) => sum + value, 0);
  const score = Math.min(10, Math.max(1, total));

  const parts = [];
  if (tempScore !== null) {
    parts.push(`temperatura ${temperature_c}°C`);
  }
  if (windScore !== null) {
    parts.push(`viento ${windspeed_kmh} km/h`);
  }
  if (conditionScore !== null) {
    parts.push(`condición ${condition}`);
  }
  if (aqiScore !== null) {
    parts.push(`AQI ${aqi_us}`);
  }

  return {
    score,
    explanation: `Score ${score}/10 basado en ${parts.join(', ')} (base 5 + ajustes PRD).`,
  };
}

/**
 * Applies source-based adjustments after base score calculation (ip_fallback −1).
 * @param {number | null} score
 * @param {'zip' | 'ip_fallback'} source
 * @returns {number | null}
 */
export function finalizeOutdoorScore(score, source) {
  if (score === null) {
    return null;
  }
  if (source === 'ip_fallback') {
    return Math.max(1, score - 1);
  }
  return score;
}

export { scoreTemperature, scoreWind, scoreCondition, scoreAqi };
