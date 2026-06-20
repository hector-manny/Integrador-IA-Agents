/**
 * Minimal logger interface for adapter-layer injection (HTTP/MCP).
 * @typedef {Object} Logger
 * @property {(...args: unknown[]) => void} error
 * @property {(...args: unknown[]) => void} info
 */

/** @type {Logger} */
export const consoleLogger = {
  error: (...args) => {
    console.error(...args);
  },
  info: (...args) => {
    console.error(...args);
  },
};

/** @type {Logger} */
export const noopLogger = {
  error: () => {},
  info: () => {},
};
