import NodeCache from 'node-cache';
import { getConfig } from '../config.js';

/**
 * Two-level cache strategy:
 * - L1 (services): raw external API payloads keyed by coordinates (`weather:lat:lon`, `air:lat:lon`).
 * - L2 (orchestrator): assembled location context keyed by ZIP (`context:zip`), with internal `{ payload, storedAt }`.
 */

const KEY_PREFIXES = {
  zip: 'zip',
  weather: 'weather',
  air: 'air',
  context: 'context',
};

/**
 * @param {'zip' | 'weather' | 'air' | 'context'} type
 * @param {...string} parts
 * @returns {string}
 */
export function buildKey(type, ...parts) {
  const prefix = KEY_PREFIXES[type];
  if (!prefix) {
    throw new Error(`Unknown cache key type: ${type}`);
  }
  return `${prefix}:${parts.join(':')}`;
}

function createCacheService() {
  const config = getConfig();
  const store = new NodeCache({ stdTTL: config.cacheTtlSeconds });

  return {
    get(key) {
      return store.get(key);
    },
    set(key, value) {
      return store.set(key, value);
    },
    has(key) {
      return store.has(key);
    },
    /**
     * @param {string} key
     * @returns {{ payload: unknown, storedAt: number } | undefined}
     */
    getContextCache(key) {
      const entry = store.get(key);
      if (!entry || typeof entry !== 'object' || !('payload' in entry)) {
        return undefined;
      }
      return entry;
    },
    /**
     * @param {string} key
     * @param {unknown} payload
     * @param {number} [storedAt]
     */
    setContextCache(key, payload, storedAt = Date.now()) {
      return store.set(key, { payload, storedAt });
    },
    buildKey,
  };
}

export const cacheService = createCacheService();

/**
 * @returns {typeof cacheService}
 */
export function getCacheService() {
  return cacheService;
}
