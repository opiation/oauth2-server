'use strict';

/**
 * Module dependencies.
 */

import { randomBytes } from 'node:crypto';
import { createHash } from '../utils/crypto-util.js';

/**
 * Generate random token.
 */
export async function generateRandomToken() {
  const buffer = randomBytes(256);
  return createHash({ data: buffer, encoding: 'hex' });
}
