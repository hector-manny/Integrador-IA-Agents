import axios from 'axios';
import { getConfig } from '../config.js';

/**
 * @param {number} [timeoutMs]
 * @returns {import('axios').AxiosInstance}
 */
export function createHttpClient(timeoutMs) {
  const config = getConfig();
  return axios.create({
    timeout: timeoutMs ?? config.httpTimeoutMs,
    headers: {
      Accept: 'application/json',
    },
  });
}
