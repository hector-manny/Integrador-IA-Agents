import { ErrorResponseSchema, ZipInputSchema } from '../models/schemas.js';

/**

 * @param {unknown} zip

 * @returns {import('zod').infer<typeof ErrorResponseSchema> | null}

 */

export function validateZipInput(zip) {
  const result = ZipInputSchema.safeParse(zip);

  if (result.success) {
    return null;
  }

  return ErrorResponseSchema.parse({
    error: true,

    code: 'INVALID_ZIP',

    message: result.error.errors[0]?.message ?? 'Invalid US ZIP code',
  });
}

/**

 * @param {string | string[]} raw

 * @returns {{

 *   validZips: string[],

 *   errors: import('zod').infer<typeof ErrorResponseSchema>[],

 * }}

 */

export function parseZipList(raw) {
  const zipList =
    typeof raw === 'string'
      ? raw

          .split(',')

          .map((value) => value.trim())

          .filter(Boolean)
      : raw;

  /** @type {string[]} */

  const validZips = [];

  /** @type {import('zod').infer<typeof ErrorResponseSchema>[]} */

  const errors = [];

  for (const zip of zipList) {
    const validationError = validateZipInput(zip);

    if (validationError) {
      errors.push(validationError);
    } else {
      validZips.push(zip);
    }
  }

  return { validZips, errors };
}
