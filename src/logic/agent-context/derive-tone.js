const SEVERITY_RANK = { critical: 4, high: 3, medium: 2, low: 1 };

/**
 * @param {Array<{ severity: string }>} alerts
 * @returns {'low' | 'medium' | 'high' | 'critical' | null}
 */
function maxAlertSeverity(alerts) {
  if (alerts.length === 0) {
    return null;
  }
  return alerts.reduce((best, alert) => {
    const bestRank = SEVERITY_RANK[best] ?? 0;
    const alertRank = SEVERITY_RANK[alert.severity] ?? 0;
    return alertRank > bestRank ? alert.severity : best;
  }, alerts[0].severity);
}

/**
 * @param {{
 *   alerts: Array<{ severity: 'low' | 'medium' | 'high' | 'critical', type: string }>,
 *   flags: { outdoor_friendly: boolean },
 * }} params
 * @returns {'urgent' | 'cautious' | 'informative' | 'friendly'}
 */
export function deriveTone({ alerts, flags }) {
  const maxSeverity = maxAlertSeverity(alerts);

  if (maxSeverity === 'critical') {
    return 'urgent';
  }
  if (maxSeverity === 'high' || maxSeverity === 'medium') {
    return 'cautious';
  }
  if (!flags.outdoor_friendly) {
    return 'informative';
  }
  return 'friendly';
}
