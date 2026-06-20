import { getMostSevereAlert } from './detect-alerts.js';
import { aqiLabelEs, conditionSkyPhraseEs, windLabelEs } from './labels.js';
import { formatLocalTimeEs } from './time-utils.js';

/**
 * @param {number | undefined} temp
 * @returns {string}
 */
function formatTemp(temp) {
  if (temp === undefined) {
    return 'temperatura no disponible';
  }
  return `${Math.round(temp)}°C`;
}

/**
 * @param {{
 *   location: { city: string, state: string },
 *   weather?: { temperature_c?: number, windspeed_kmh?: number, condition?: string, observed_at?: string } | null,
 *   air_quality?: { aqi_us?: number, level?: string } | null,
 *   alerts: Array<{ severity: string, message: string, type: string }>,
 *   source: 'zip' | 'ip_fallback',
 *   flags: { outdoor_friendly: boolean, needs_jacket: boolean },
 *   recommendations: { clothing: string },
 * }} params
 * @returns {string}
 */
export function composeSummary({
  location,
  weather,
  air_quality,
  alerts,
  source,
  flags,
  recommendations,
}) {
  const topAlert = getMostSevereAlert(alerts);
  const parts = [];

  if (topAlert && (topAlert.severity === 'critical' || topAlert.severity === 'high')) {
    if (topAlert.type === 'air_quality' && air_quality?.aqi_us !== undefined) {
      parts.push(
        `Cuidado — la calidad del aire en ${location.city} está ${aqiLabelEs(air_quality.aqi_us)} hoy (AQI ${Math.round(air_quality.aqi_us)}). ${topAlert.message}`,
      );
    } else {
      parts.push(`Cuidado — ${topAlert.message}`);
    }
  }

  const locationIntro =
    source === 'ip_fallback'
      ? `Detecté tu ubicación aproximada por IP: ${location.city}, ${location.state} (puede no ser exacta).`
      : `Estás en ${location.city}, ${location.state}.`;

  if (parts.length === 0) {
    parts.push(locationIntro);
  } else if (source === 'ip_fallback') {
    parts.push(locationIntro);
  }

  const timeStr = formatLocalTimeEs(weather?.observed_at);
  const skyPhrase = conditionSkyPhraseEs(weather?.condition);
  const tempStr = formatTemp(weather?.temperature_c);
  const windLabel = windLabelEs(weather?.windspeed_kmh);

  /** @type {string[]} */
  const weatherParts = [];
  if (timeStr) {
    weatherParts.push(`Son las ${timeStr}`);
  }
  if (weather?.temperature_c !== undefined) {
    const windPart =
      windLabel && weather.windspeed_kmh !== undefined
        ? ` y viento ${windLabel} de ${Math.round(weather.windspeed_kmh)} km/h`
        : windLabel
          ? ` y viento ${windLabel}`
          : '';
    weatherParts.push(`hace ${tempStr} con cielo ${skyPhrase}${windPart}`);
  } else if (weather?.condition) {
    weatherParts.push(`hay cielo ${skyPhrase}`);
  }

  if (weatherParts.length > 0) {
    parts.push(`${weatherParts.join(', ')}.`);
  }

  if (air_quality?.aqi_us !== undefined && topAlert?.type !== 'air_quality') {
    parts.push(
      `La calidad del aire es ${aqiLabelEs(air_quality.aqi_us)} (AQI ${Math.round(air_quality.aqi_us)}).`,
    );
  }

  if (flags.outdoor_friendly) {
    const jacketHint = flags.needs_jacket
      ? ` — conviene llevar ${recommendations.clothing.toLowerCase()}.`
      : '.';
    parts.push(`Buenas condiciones para estar al aire libre${jacketHint}`);
  } else if (alerts.length === 0 && weather?.temperature_c !== undefined) {
    parts.push('Las condiciones exteriores requieren precaución.');
  }

  return parts.join(' ').replace(/\s+/g, ' ').trim();
}
