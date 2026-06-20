/**
 * @param {string | undefined} observedAt ISO local time from Open-Meteo (e.g. 2026-06-18T15:42)
 * @returns {number | null} hour 0-23
 */
export function extractLocalHour(observedAt) {
  if (!observedAt) {
    return null;
  }
  const match = observedAt.match(/T(\d{2}):/);
  if (!match) {
    return null;
  }
  return parseInt(match[1], 10);
}

/**
 * @param {string | undefined} observedAt
 * @returns {string | null} e.g. "3:42 PM"
 */
export function formatLocalTimeEs(observedAt) {
  const hour = extractLocalHour(observedAt);
  if (hour === null) {
    return null;
  }
  const minuteMatch = observedAt.match(/T\d{2}:(\d{2})/);
  const minute = minuteMatch ? minuteMatch[1] : '00';
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minute} ${period}`;
}

/**
 * @param {string | undefined} observedAt
 * @returns {boolean}
 */
export function isDaytime(observedAt) {
  const hour = extractLocalHour(observedAt);
  if (hour === null) {
    return false;
  }
  return hour >= 6 && hour < 20;
}

/**
 * @param {string | undefined} observedAt
 * @returns {boolean}
 */
export function isMidday(observedAt) {
  const hour = extractLocalHour(observedAt);
  if (hour === null) {
    return false;
  }
  return hour >= 10 && hour <= 16;
}

/**
 * @param {string | undefined} observedAt
 * @returns {'mañana' | 'tarde' | 'noche' | 'madrugada' | null}
 */
export function deriveBestWindowToday(observedAt) {
  const hour = extractLocalHour(observedAt);
  if (hour === null) {
    return null;
  }
  if (hour >= 6 && hour < 12) {
    return 'mañana';
  }
  if (hour >= 12 && hour < 18) {
    return 'tarde';
  }
  if (hour >= 18 && hour < 22) {
    return 'noche';
  }
  return 'madrugada';
}

/**
 * @param {Date} [date]
 * @returns {string} ISO 8601 with offset
 */
export function toIsoWithOffset(date = new Date()) {
  const offsetMin = -date.getTimezoneOffset();
  const sign = offsetMin >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMin);
  const offsetHours = String(Math.floor(abs / 60)).padStart(2, '0');
  const offsetMins = String(abs % 60).padStart(2, '0');
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${d}T${h}:${min}:${s}${sign}${offsetHours}:${offsetMins}`;
}
