'use strict';

/**
 * @param {Date} expiresAt The date at which something (e.g. a token) expires.
 * @return {number} The number of seconds until the expiration date.
 */
export function getLifetimeFromExpiresAt(expiresAt) {
  return Math.floor((expiresAt - new Date()) / 1000);
}
