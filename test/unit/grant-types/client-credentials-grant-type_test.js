'use strict';

/**
 * Module dependencies.
 */

import ClientCredentialsGrantType from '../../../lib/grant-types/client-credentials-grant-type.js';
import { describe, expect, it, sinon } from '../../test-utils.js';

/**
 * Test `ClientCredentialsGrantType`.
 */

describe('ClientCredentialsGrantType', function () {
  describe('getUserFromClient()', function () {
    it('calls `model.getUserFromClient()`', function () {
      const model = {
        getUserFromClient: sinon.stub().returns(true),
        saveToken: function () {}
      };
      const handler = new ClientCredentialsGrantType({
        accessTokenLifetime: 120,
        model: model
      });
      const client = {};

      return handler
        .getUserFromClient(client)
        .then(function () {
          expect(model.getUserFromClient.callCount).to.equal(1);
          expect(model.getUserFromClient.firstCall.args).to.have.length(1);
          expect(model.getUserFromClient.firstCall.args[0]).to.equal(client);
          expect(model.getUserFromClient.firstCall.thisValue).to.equal(model);
        })
        .catch(expect.fail);
    });
  });

  describe('saveToken()', function () {
    it('calls `model.saveToken()`', function () {
      const client = {};
      const user = {};
      const model = {
        getUserFromClient: function () {},
        saveToken: sinon.stub().returns(true)
      };
      const handler = new ClientCredentialsGrantType({
        accessTokenLifetime: 120,
        model: model
      });

      sinon.stub(handler, 'validateScope').returns(['foobar']);
      sinon.stub(handler, 'generateAccessToken').returns('foo');
      sinon.stub(handler, 'getAccessTokenExpiresAt').returns('biz');

      return handler
        .saveToken(user, client, ['foobar'])
        .then(function () {
          expect(model.saveToken.callCount).to.equal(1);
          expect(model.saveToken.firstCall.args).to.have.length(3);
          expect(model.saveToken.firstCall.args[0]).to.eql({
            accessToken: 'foo',
            accessTokenExpiresAt: 'biz',
            scope: ['foobar']
          });
          expect(model.saveToken.firstCall.args[1]).to.equal(client);
          expect(model.saveToken.firstCall.args[2]).to.equal(user);
          expect(model.saveToken.firstCall.thisValue).to.equal(model);
        })
        .catch(expect.fail);
    });
  });
});
