import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { isMainModule } from '../utils/is-main-module.js';
import { consoleLogger } from '../utils/logger.js';
import {
  getLocationContext,
  getLocationContexts,
} from '../orchestrators/location-context.orchestrator.js';
import { parseZipList, validateZipInput } from '../adapters/input-validation.js';
import { ErrorResponseSchema, isErrorResponse, ZipInputSchema } from '../models/schemas.js';

/**
 * @param {import('../utils/logger.js').Logger} logger
 * @returns {(handler: () => Promise<{ content: Array<{ type: string, text: string }>, isError: boolean }>) => Promise<{ content: Array<{ type: string, text: string }>, isError: boolean }>}
 */
function createMcpErrorBoundary(logger) {
  return async function withMcpErrorBoundary(handler) {
    try {
      return await handler();
    } catch (error) {
      logger.error(error);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              ErrorResponseSchema.parse({
                error: true,
                code: 'INTERNAL_ERROR',
                message: 'Internal server error',
              }),
              null,
              2,
            ),
          },
        ],
        isError: true,
      };
    }
  };
}

/**
 * @param {{ logger?: import('../utils/logger.js').Logger }} [options]
 * @returns {McpServer}
 */
export function createMcpServer(options = {}) {
  const logger = options.logger ?? consoleLogger;
  const withMcpErrorBoundary = createMcpErrorBoundary(logger);
  const server = new McpServer({
    name: 'integrador-ia-location-context',
    version: '0.3.0',
  });

  server.registerTool(
    'get_location_context',
    {
      description:
        'Resolve a US ZIP code into enriched location context (weather, air quality, outdoor score, agent_context). Falls back to IP geolocation if ZIP lookup fails.',
      inputSchema: {
        zip: ZipInputSchema.describe('US ZIP code (5 digits)'),
      },
    },
    async ({ zip }) =>
      withMcpErrorBoundary(async () => {
        const validationError = validateZipInput(zip);
        if (validationError) {
          return {
            content: [{ type: 'text', text: JSON.stringify(validationError, null, 2) }],
            isError: true,
          };
        }

        const result = await getLocationContext(zip);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          isError: isErrorResponse(result),
        };
      }),
  );

  server.registerTool(
    'get_location_contexts',
    {
      description:
        'Resolve multiple US ZIP codes in parallel. Returns an array of location contexts or structured errors per ZIP.',
      inputSchema: {
        zips: z.array(ZipInputSchema).min(1).describe('Array of US ZIP codes'),
      },
    },
    async ({ zips }) =>
      withMcpErrorBoundary(async () => {
        const { validZips, errors } = parseZipList(zips);

        const contexts = validZips.length > 0 ? await getLocationContexts(validZips) : [];
        const combined = errors.length > 0 ? [...errors, ...contexts] : contexts;

        return {
          content: [{ type: 'text', text: JSON.stringify(combined, null, 2) }],
          isError: errors.length > 0 || combined.some((item) => isErrorResponse(item)),
        };
      }),
  );

  return server;
}

/**
 * @param {{ logger?: import('../utils/logger.js').Logger }} [options]
 * @returns {Promise<void>}
 */
export async function startMcpServer(options = {}) {
  const logger = options.logger ?? consoleLogger;
  const server = createMcpServer({ logger });
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

if (isMainModule(import.meta.url)) {
  startMcpServer().catch((error) => {
    consoleLogger.error('MCP server error:', error);
    process.exitCode = 1;
  });
}
