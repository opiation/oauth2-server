'use strict';

/**
 * Module dependencies.
 */

import { generateRandomToken } from '../../../lib/utils/token-util.js';
import { describe, expect, it } from '../../test-utils.js';

/**
 * Test `TokenUtil` integration.
 */

describe('TokenUtil integration', function () {
  describe('generateRandomToken()', function () {
    it('returns a sha-256 token', async function () {
      const token = await generateRandomToken();
      expect(token).to.be.a.sha256();
    });
  });
});
