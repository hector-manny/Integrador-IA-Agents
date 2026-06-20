import { WIND_CALM_MAX, WIND_MODERATE_MAX, WIND_STRONG_MAX } from '../thresholds.js';

/** Spanish labels for agent-facing narrative text. */

export const CONDITION_LABELS_ES = {
  Clear: 'despejado',
  'Mainly Clear': 'mayormente despejado',
  'Partly Cloudy': 'parcialmente nublado',
  Cloudy: 'nublado',
  Foggy: 'con niebla',
  'Light Rain': 'con llovizna',
  'Moderate Rain': 'con lluvia moderada',
  Rainy: 'lluvioso',
  'Heavy Rain': 'con lluvia intensa',
  'Rain Showers': 'con chubascos',
  'Heavy Rain Showers': 'con chubascos intensos',
  Snowy: 'nevado',
  'Heavy Snow': 'con nieve intensa',
  Thunderstorm: 'con tormenta',
  'Severe Thunderstorm': 'con tormenta severa',
  Unknown: 'condiciones variables',
};

/** Predicative sky phrases for summary templates: "cielo ${phrase}" (ADR-052). */
export const CONDITION_SKY_PHRASE_ES = {
  Clear: 'despejado',
  'Mainly Clear': 'mayormente despejado',
  'Partly Cloudy': 'parcialmente nublado',
  Cloudy: 'nublado',
  Foggy: 'con niebla',
  'Light Rain': 'con llovizna',
  'Moderate Rain': 'con lluvia moderada',
  Rainy: 'lluvioso',
  'Heavy Rain': 'con lluvia intensa',
  'Rain Showers': 'con chubascos',
  'Heavy Rain Showers': 'con chubascos intensos',
  Snowy: 'nevado',
  'Heavy Snow': 'con nieve intensa',
  Thunderstorm: 'cubierto con tormenta eléctrica activa',
  'Severe Thunderstorm': 'cubierto con tormenta severa',
  Unknown: 'con condiciones variables',
};

export const AQI_LABELS_ES = {
  good: 'buena',
  moderate: 'moderada',
  sensitive: 'insalubre para grupos sensibles',
  unhealthy: 'poco saludable',
  very_unhealthy: 'muy insalubre',
  hazardous: 'peligrosa',
};

/**
 * @param {string | undefined} condition
 * @returns {string}
 */
export function conditionLabelEs(condition) {
  if (!condition) {
    return 'condiciones no disponibles';
  }
  return CONDITION_LABELS_ES[condition] ?? condition.toLowerCase();
}

/**
 * Sky phrase for summary: "cielo ${phrase}" (singular, grammatically correct).
 * @param {string | undefined} condition
 * @returns {string}
 */
export function conditionSkyPhraseEs(condition) {
  if (!condition) {
    return 'con condiciones no disponibles';
  }
  return CONDITION_SKY_PHRASE_ES[condition] ?? condition.toLowerCase();
}

/**
 * @param {number | undefined} aqi
 * @returns {string}
 */
export function aqiLabelEs(aqi) {
  if (aqi === undefined) {
    return 'no disponible';
  }
  if (aqi <= 50) {
    return AQI_LABELS_ES.good;
  }
  if (aqi <= 100) {
    return AQI_LABELS_ES.moderate;
  }
  if (aqi <= 150) {
    return AQI_LABELS_ES.sensitive;
  }
  if (aqi <= 200) {
    return AQI_LABELS_ES.unhealthy;
  }
  if (aqi <= 300) {
    return AQI_LABELS_ES.very_unhealthy;
  }
  return AQI_LABELS_ES.hazardous;
}

/**
 * Full AQI phrase for tldr/summary narrative (EPA-aligned, ADR-053).
 * @param {number | undefined} aqi
 * @returns {string}
 */
export function formatAqiPhraseEs(aqi) {
  if (aqi === undefined) {
    return 'aire no disponible';
  }
  if (aqi <= 50) {
    return 'aire limpio';
  }
  if (aqi <= 100) {
    return 'aire moderado';
  }
  if (aqi <= 150) {
    return 'aire poco saludable para sensibles';
  }
  if (aqi <= 200) {
    return 'aire poco saludable';
  }
  if (aqi <= 300) {
    return 'aire muy poco saludable';
  }
  return 'aire peligroso';
}

/**
 * @param {number | undefined} windspeedKmh
 * @returns {string | null}
 */
export function windLabelEs(windspeedKmh) {
  if (windspeedKmh === undefined) {
    return null;
  }
  if (windspeedKmh < WIND_CALM_MAX) {
    return 'bajo';
  }
  if (windspeedKmh < WIND_MODERATE_MAX) {
    return 'moderado';
  }
  if (windspeedKmh < WIND_STRONG_MAX) {
    return 'moderado a fuerte';
  }
  return 'fuerte';
}
