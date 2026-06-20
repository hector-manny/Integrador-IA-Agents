/**
 * Builds a minimal axios-like client for mocking service HTTP calls.
 *
 * @param {{
 *   get?: (url: string, config?: { params?: Record<string, unknown> }) => Promise<{ data: unknown }>,
 * }} handlers
 * @returns {{ get: (url: string, config?: { params?: Record<string, unknown> }) => Promise<{ data: unknown }> }}
 */
export function createMockHttpClient(handlers = {}) {
  return {
    get: async (url, config) => {
      if (handlers.get) {
        return handlers.get(url, config);
      }
      throw new Error(`Unexpected GET ${url}`);
    },
  };
}

/**
 * @param {unknown} data
 * @returns {{ get: () => Promise<{ data: unknown }> }}
 */
export function mockGetResponse(data) {
  return {
    get: async () => ({ data }),
  };
}
