import NodeCache from 'node-cache';
import { getConfig } from '../config.js';

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
