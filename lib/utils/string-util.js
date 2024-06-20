'use strict';

/**
 *
 * @param str
 * @return {string}
 */
export function base64URLEncode(str) {
  return str
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}
