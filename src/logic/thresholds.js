/** Shared domain thresholds — single source of truth (plans 011, 014). */

/** @type {readonly [number, number]} */

export const TEMP_IDEAL_RANGE = [18, 26];

export const TEMP_COOL_MIN = 10;

export const TEMP_WARM_MAX = 32;

export const TEMP_FREEZING = 0;

export const TEMP_EXTREME_HEAT = 35;

export const TEMP_COLD_RISK = 5;

export const TEMP_HOT_RISK = 32;

export const TEMP_COOL_MESSAGE = 10;

export const TEMP_WARM_MESSAGE = 28;

/** Outdoor-score temp bands (ADR-050). */

export const TEMP_WARM_SCORE_MAX = 30;

export const TEMP_HOT_SCORE_MAX = 32;

export const TEMP_HEAT_SCORE_MAX = 35;

/** Wind speed (km/h) — flags, alerts, score, labels (ADR-054). */

export const WIND_CALM_MAX = 12;

export const WIND_MILD_MAX = 18;

export const WIND_MODERATE_MAX = 25;

export const WIND_STRONG_MAX = 35;

export const WIND_STRONG_MIN = 35;

/** Wind concern and alert triggers (inclusive lower bound). */

export const WIND_CONCERN_MIN = 20;

export const WIND_ALERT_MEDIUM_MIN = 20;

export const WIND_ALERT_HIGH_MIN = 35;

/** AQI US — general bands (flags, alerts). */

export const AQI_GOOD_MAX = 50;

export const AQI_MODERATE_MAX = 100;

export const AQI_SENSITIVE_MAX = 150;

export const AQI_UNHEALTHY_MIN = 101;

/** AQI US — outdoor-score bands (ADR-050). */

export const AQI_GOOD_SCORE_MAX = 50;

export const AQI_MODERATE_LOW_MAX = 75;

export const AQI_MODERATE_HIGH_MAX = 100;
