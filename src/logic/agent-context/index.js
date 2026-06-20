import { computeFlags } from './compute-flags.js';
import { composeHeadline } from './compose-headline.js';
import { composeSummary } from './compose-summary.js';
import { composeTldr } from './compose-tldr.js';
import { detectAlerts } from './detect-alerts.js';
import { deriveRecommendations } from './derive-recommendations.js';
import { buildFollowupHints, buildMeta } from './followup-hints.js';
import { deriveTone } from './derive-tone.js';
import { toIsoWithOffset } from './time-utils.js';

/**
 * @param {{
 *   input?: { zip?: string | null, source?: 'zip' | 'ip_fallback' },
 *   location: { city: string, state: string, country?: string },
 *   weather?: {
 *     temperature_c: number,
 *     windspeed_kmh: number,
 *     condition: string,
 *     observed_at?: string,
 *   } | null,
 *   air_quality?: { aqi_us: number, level: string, dominant_pollutant: string } | null,
 *   outdoor_score?: number | null,
 *   meta?: { dataAgeMinutes?: number, ttlSeconds?: number, generatedAt?: string },
 * }} context
 */
export function buildAgentContext(context) {
  const { input, location, weather, air_quality, outdoor_score, meta = {} } = context;
  const source = input?.source ?? 'zip';
  const dataAgeMinutes = meta.dataAgeMinutes ?? 0;
  const ttlSeconds = meta.ttlSeconds ?? 900;
  const generatedAt = meta.generatedAt ?? toIsoWithOffset(new Date());

  const alerts = detectAlerts({ weather, air_quality });
  const flags = computeFlags({
    weather,
    air_quality,
    outdoor_score,
    source,
    alerts,
  });
  const recommendations = deriveRecommendations({
    weather,
    air_quality,
    outdoor_score,
    source,
    flags,
    alerts,
  });
  const summary = composeSummary({
    location,
    weather,
    air_quality,
    alerts,
    source,
    flags,
    recommendations,
  });
  const headline = composeHeadline({
    outdoor_score,
    alerts,
    location,
    flags,
    weather,
  });
  const tldr = composeTldr({ weather, air_quality });
  const response_tone = deriveTone({ alerts, flags });
  const followup_hints = buildFollowupHints({
    source,
    location,
    dataAgeMinutes,
    flags,
  });
  const agentMeta = buildMeta({ source, generatedAt, ttlSeconds });

  return {
    summary,
    headline,
    tldr,
    response_tone,
    flags,
    recommendations,
    alerts,
    followup_hints,
    meta: agentMeta,
  };
}
