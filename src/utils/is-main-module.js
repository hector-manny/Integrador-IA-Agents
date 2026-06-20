/**
 * Detects whether the current module was invoked directly (e.g. `node src/cli/cli.js`).
 * @param {string} importMetaUrl - `import.meta.url` of the entry module
 * @returns {boolean}
 */
export function isMainModule(importMetaUrl) {
  return Boolean(
    process.argv[1] && importMetaUrl.endsWith(process.argv[1].replace(/\\/g, '/')),
  );
}
