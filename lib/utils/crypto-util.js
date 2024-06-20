'use strict';

import crypto from 'node:crypto';

/**
 *
 * @param {string} algorithm the hash algorithm, default is 'sha256'
 * @param data {Buffer|String|TypedArray|DataView} the data to hash
 * @param {string | undefined} [encoding] optional, the encoding to calculate the
 *    digest
 * @return {Buffer | String} if {encoding} undefined a {Buffer} is returned, otherwise a {String}
 */
export function createHash({
  algorithm = 'sha256',
  data = undefined,
  encoding = undefined
}) {
  return crypto.createHash(algorithm).update(data).digest(encoding);
}
