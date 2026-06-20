import { z } from 'zod';

export const ZipInputSchema = z.string().regex(/^\d{5}$/, 'Invalid US ZIP code');

export const InputSchema = z.object({
  zip: z.string().nullable(),
  source: z.enum(['zip', 'ip_fallback']),
});

const finiteNumber = z.number().finite();

export const LocationSchema = z.object({
  city: z.string(),
  state: z.string(),
  country: z.string(),
  lat: finiteNumber,
  lon: finiteNumber,
});

export const WeatherSchema = z.object({
  temperature_c: finiteNumber,
  windspeed_kmh: finiteNumber,
  condition: z.string(),
  observed_at: z.string().optional(),
});

export const AirQualitySchema = z.object({
  aqi_us: finiteNumber,
  level: z.string(),
  dominant_pollutant: z.string(),
});

const alertSeveritySchema = z.enum(['low', 'medium', 'high', 'critical']);
const responseToneSchema = z.enum(['urgent', 'cautious', 'informative', 'friendly']);

export const AgentContextSchema = z.object({
  summary: z.string(),
  headline: z.string(),
  tldr: z.string(),
  response_tone: responseToneSchema,
  flags: z.object({
    outdoor_friendly: z.boolean(),
    needs_jacket: z.boolean(),
    needs_umbrella: z.boolean(),
    needs_sunscreen: z.boolean(),
    uv_concern: z.boolean(),
    air_quality_concern: z.boolean(),
    wind_concern: z.boolean(),
    extreme_temperature: z.boolean(),
    location_confidence: z.enum(['high', 'medium', 'low']),
  }),
  recommendations: z.object({
    clothing: z.string(),
    suitable_activities: z.array(z.string()),
    avoid_activities: z.array(z.string()),
    hydration_priority: z.enum(['normal', 'high', 'critical']),
    best_window_today: z.enum(['mañana', 'tarde', 'noche', 'madrugada']).optional(),
  }),
  alerts: z.array(
    z.object({
      severity: alertSeveritySchema,
      type: z.string(),
      message: z.string(),
      affects: z.array(z.string()).optional(),
    }),
  ),
  followup_hints: z.object({
    user_location_known: z.boolean(),
    data_age_minutes: z.number().nonnegative(),
    suggested_questions: z.array(z.string()),
  }),
  meta: z.object({
    generated_at: z.string(),
    location_source: z.enum(['zip', 'ip_fallback']),
    ttl_seconds: z.number().positive(),
  }),
});

export const LocationContextSchema = z.object({
  input: InputSchema,
  location: LocationSchema,
  weather: WeatherSchema.nullable(),
  air_quality: AirQualitySchema.nullable(),
  outdoor_score: finiteNumber.min(1).max(10).nullable(),
  agent_context: AgentContextSchema,
});

export const ErrorCodeSchema = z.enum(['LOCATION_NOT_FOUND', 'INVALID_ZIP', 'INTERNAL_ERROR']);

export const ErrorResponseSchema = z.object({
  error: z.literal(true),
  code: ErrorCodeSchema,
  message: z.string(),
});

export const MultiZipInputSchema = z.array(ZipInputSchema).min(1);

export const LocationContextOrErrorSchema = z.union([LocationContextSchema, ErrorResponseSchema]);

export const MultiLocationContextSchema = z.array(LocationContextOrErrorSchema);

/**
 * @param {unknown} raw
 * @returns {string}
 */
export function parseZipInput(raw) {
  return ZipInputSchema.parse(raw);
}

/**
 * @param {unknown} data
 * @returns {{ success: true, data: z.infer<typeof LocationContextSchema> } | { success: false, error: z.ZodError }}
 */
export function safeParseLocationContext(data) {
  return LocationContextSchema.safeParse(data);
}

/**
 * @param {unknown} obj
 * @returns {obj is z.infer<typeof ErrorResponseSchema>}
 */
export function isErrorResponse(obj) {
  return ErrorResponseSchema.safeParse(obj).success;
}
