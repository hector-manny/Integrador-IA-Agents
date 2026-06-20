import 'dotenv/config';

import { parseConfig } from './models/config.schema.js';

/** @type {ReturnType<typeof parseConfig> | null} */
let cachedConfig = null;

export function getConfig() {
  if (!cachedConfig) {
    cachedConfig = parseConfig();
  }
  return cachedConfig;
}

/** @internal Resets cached config — for tests only. */
export function resetConfigCache() {
  cachedConfig = null;
}
