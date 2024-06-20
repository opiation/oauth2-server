'use strict';

/**
 * Module dependencies.
 */

import { generateRandomToken } from '../../../lib/utils/token-util.js';

/**
 * Test `TokenUtil` integration.
 */

describe('TokenUtil integration', function () {
  describe('generateRandomToken()', function () {
    it('should return a sha-256 token', async function () {
      const token = await generateRandomToken();
      token.should.be.a.sha256();
    });
  });
});
