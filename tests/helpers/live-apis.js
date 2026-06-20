import { describe } from 'node:test';

/** @returns {boolean} */
export function liveApisEnabled() {
  return process.env.LIVE_APIS === '1';
}

/**
 * @param {string} name
 * @param {import('node:test').TestOptions | (() => void)} [optionsOrFn]
 * @param {(() => void)=} maybeFn
 */
export function describeLive(name, optionsOrFn, maybeFn) {
  /** @type {import('node:test').TestOptions} */
  const options = typeof optionsOrFn === 'function' ? {} : (optionsOrFn ?? {});
  const fn = typeof optionsOrFn === 'function' ? optionsOrFn : maybeFn;
  if (!fn) {
    throw new Error('describeLive requires a callback');
  }

  if (liveApisEnabled()) {
    describe(name, options, fn);
  } else {
    describe.skip(name, options, fn);
  }
}
