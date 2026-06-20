import { z } from 'zod';

const positiveInt = (field) =>
  z.coerce
    .number({ invalid_type_error: `${field} must be a number` })
    .int(`${field} must be an integer`)
    .positive(`${field} must be positive`);

export const ConfigSchema = z.object({
  port: positiveInt('PORT').default(3000),
  cacheTtlSeconds: positiveInt('CACHE_TTL_SECONDS').default(900),
  httpTimeoutMs: positiveInt('HTTP_TIMEOUT_MS').default(5000),
  ipApiBaseUrl: z.string().url().default('http://ip-api.com'),
});

/**
 * @param {NodeJS.ProcessEnv} [env]
 */
export function parseConfig(env = process.env) {
  return ConfigSchema.parse({
    port: env.PORT,
    cacheTtlSeconds: env.CACHE_TTL_SECONDS,
    httpTimeoutMs: env.HTTP_TIMEOUT_MS,
    ipApiBaseUrl: env.IP_API_BASE_URL,
  });
}
