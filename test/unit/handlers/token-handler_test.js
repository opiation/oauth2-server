'use strict';

/**
 * Module dependencies.
 */

import Request from '../../../lib/request.js';
import TokenHandler from '../../../lib/handlers/token-handler.js';
import { describe, expect, it, sinon } from '../../test-utils.js';

/**
 * Test `TokenHandler`.
 */

describe('TokenHandler', function () {
  describe('getClient()', function () {
    it('calls `model.getClient()`', function () {
      const model = {
        getClient: sinon.stub().returns({ grants: ['password'] }),
        saveToken: function () {}
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120
      });
      const request = new Request({
        body: { client_id: 12345, client_secret: 'secret' },
        headers: {},
        method: {},
        query: {}
      });

      return handler
        .getClient(request)
        .then(function () {
          expect(model.getClient.callCount).to.equal(1);
          expect(model.getClient.firstCall.args).to.have.length(2);
          expect(model.getClient.firstCall.args[0]).to.equal(12345);
          expect(model.getClient.firstCall.args[1]).to.equal('secret');
          expect(model.getClient.firstCall.thisValue).to.equal(model);
        })
        .catch(expect.fail);
    });
  });
});
