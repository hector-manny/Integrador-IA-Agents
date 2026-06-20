import express from 'express';

import { getConfig } from '../config.js';
import { isMainModule } from '../utils/is-main-module.js';
import { consoleLogger } from '../utils/logger.js';
import {
  getLocationContext,
  getLocationContexts,
} from '../orchestrators/location-context.orchestrator.js';
import { parseZipList, validateZipInput } from '../adapters/input-validation.js';
import { ErrorResponseSchema, isErrorResponse } from '../models/schemas.js';

/**
 * @param {string} code
 * @returns {number}
 */
function httpStatusForError(code) {
  if (code === 'LOCATION_NOT_FOUND') {
    return 404;
  }
  if (code === 'INVALID_ZIP') {
    return 400;
  }
  return 500;
}

/**
 * @param {string} message
 * @returns {import('zod').infer<typeof ErrorResponseSchema>}
 */
function invalidZipError(message) {
  return ErrorResponseSchema.parse({
    error: true,
    code: 'INVALID_ZIP',
    message,
  });
}

/**
 * @param {{ enableTestRoutes?: boolean, logger?: import('../utils/logger.js').Logger }} [options]
 * @returns {import('express').Express}
 */
export function createApp(options = {}) {
  const logger = options.logger ?? consoleLogger;
  const app = express();

  app.get('/context', async (req, res, next) => {
    try {
      const { zip } = req.query;

      if (!zip || typeof zip !== 'string') {
        return res.status(400).json(invalidZipError('Query parameter zip is required'));
      }

      const validationError = validateZipInput(zip);
      if (validationError) {
        return res.status(400).json(validationError);
      }

      const result = await getLocationContext(zip);

      if (isErrorResponse(result)) {
        return res.status(httpStatusForError(result.code)).json(result);
      }

      return res.json(result);
    } catch (error) {
      return next(error);
    }
  });

  app.get('/contexts', async (req, res, next) => {
    try {
      const { zips } = req.query;

      if (!zips || typeof zips !== 'string') {
        return res
          .status(400)
          .json(invalidZipError('Query parameter zips is required (comma-separated)'));
      }

      const { validZips, errors } = parseZipList(zips);

      if (validZips.length === 0 && errors.length === 0) {
        return res.status(400).json(invalidZipError('At least one ZIP code is required'));
      }

      const contexts = validZips.length > 0 ? await getLocationContexts(validZips) : [];
      const combined = errors.length > 0 ? [...errors, ...contexts] : contexts;
      return res.json(combined);
    } catch (error) {
      return next(error);
    }
  });

  if (options.enableTestRoutes) {
    app.get('/__test_error', (_req, _res, next) => {
      next(new Error('sensitive-internal-detail-xyz'));
    });
  }

  app.use((err, _req, res, _next) => {
    logger.error(err);

    res.status(500).json(
      ErrorResponseSchema.parse({
        error: true,
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      }),
    );
  });

  return app;
}

/**
 * @param {{ logger?: import('../utils/logger.js').Logger }} [options]
 * @returns {Promise<import('node:http').Server>}
 */
export async function start(options = {}) {
  const logger = options.logger ?? consoleLogger;
  const config = getConfig();
  const app = createApp({ logger });

  return new Promise((resolve) => {
    const server = app.listen(config.port, () => {
      logger.info(`HTTP server listening on port ${config.port}`);
      resolve(server);
    });
  });
}

if (isMainModule(import.meta.url)) {
  start().catch((error) => {
    consoleLogger.error(error);
    process.exitCode = 1;
  });
}
