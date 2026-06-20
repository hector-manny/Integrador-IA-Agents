import {
  getLocationContext,
  getLocationContexts,
} from '../orchestrators/location-context.orchestrator.js';
import { parseZipList } from '../adapters/input-validation.js';
import { isErrorResponse } from '../models/schemas.js';

/**
 * @param {string[]} argv
 * @returns {Promise<number>}
 */
export async function main(argv = process.argv.slice(2)) {
  if (argv.length === 0) {
    console.error('Usage: node index.js <zip> [zip2 ...]');
    return 1;
  }

  const { validZips, errors } = parseZipList(argv);

  if (validZips.length === 0) {
    const output = argv.length === 1 ? errors[0] : errors;
    console.log(JSON.stringify(output, null, 2));
    return 1;
  }

  if (validZips.length === 1 && errors.length === 0) {
    const result = await getLocationContext(validZips[0]);
    console.log(JSON.stringify(result, null, 2));
    return isErrorResponse(result) ? 1 : 0;
  }

  const contexts = await getLocationContexts(validZips);
  const combined = errors.length > 0 ? [...errors, ...contexts] : contexts;
  console.log(JSON.stringify(combined, null, 2));

  const hasError = errors.length > 0 || combined.some((item) => isErrorResponse(item));
  return hasError ? 1 : 0;
}

const isDirectRun =
  process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'));

if (isDirectRun) {
  main().then((code) => {
    process.exitCode = code;
  });
}
