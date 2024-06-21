'use strict';

/**
 * Module dependencies.
 */

import PasswordGrantType from '../../../lib/grant-types/password-grant-type.js';
import Request from '../../../lib/request.js';
import { describe, expect, it, sinon } from '../../test-utils.js';

/**
 * Test `PasswordGrantType`.
 */

describe('PasswordGrantType', function () {
  describe('getUser()', function () {
    it('calls `model.getUser()`', function () {
      const model = {
        getUser: sinon.stub().returns(true),
        saveToken: function () {}
      };
      const client = { id: 'foobar' };
      const handler = new PasswordGrantType({
        accessTokenLifetime: 120,
        model: model
      });
      const request = new Request({
        body: { username: 'foo', password: 'bar' },
        headers: {},
        method: {},
        query: {}
      });

      return handler
        .getUser(request, client)
        .then(function () {
          expect(model.getUser.callCount).to.equal(1);
          expect(model.getUser.firstCall.args).to.have.length(3);
          expect(model.getUser.firstCall.args[0]).to.equal('foo');
          expect(model.getUser.firstCall.args[1]).to.equal('bar');
          expect(model.getUser.firstCall.thisValue).to.equal(model);
        })
        .catch(expect.fail);
    });
  });

  describe('saveToken()', function () {
    it('calls `model.saveToken()`', function () {
      const client = {};
      const user = {};
      const model = {
        getUser: function () {},
        saveToken: sinon.stub().returns(true)
      };
      const handler = new PasswordGrantType({
        accessTokenLifetime: 120,
        model: model
      });

      sinon.stub(handler, 'validateScope').returns(['foobar']);
      sinon.stub(handler, 'generateAccessToken').returns('foo');
      sinon.stub(handler, 'generateRefreshToken').returns('bar');
      sinon.stub(handler, 'getAccessTokenExpiresAt').returns('biz');
      sinon.stub(handler, 'getRefreshTokenExpiresAt').returns('baz');

      return handler
        .saveToken(user, client, ['foobar'])
        .then(function () {
          expect(model.saveToken.callCount).to.equal(1);
          expect(model.saveToken.firstCall.args).to.have.length(3);
          expect(model.saveToken.firstCall.args[0]).to.eql({
            accessToken: 'foo',
            accessTokenExpiresAt: 'biz',
            refreshToken: 'bar',
            refreshTokenExpiresAt: 'baz',
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
