import { createApp } from '../../src/http/server.js';

/**
 * @param {(baseUrl: string) => Promise<void>} fn
 * @param {() => import('express').Express} [appFactory]
 */
export async function withHttpServer(fn, appFactory = createApp) {
  const app = appFactory();
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await fn(baseUrl);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

/**
 * @param {string} baseUrl
 * @param {string} path
 */
export async function httpGet(baseUrl, path) {
  const response = await fetch(`${baseUrl}${path}`);
  const body = await response.json();
  return { status: response.status, body };
}
