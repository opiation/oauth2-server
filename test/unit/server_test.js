'use strict';

/**
 * Module dependencies.
 */

import AuthenticateHandler from '../../lib/handlers/authenticate-handler.js';
import AuthorizeHandler from '../../lib/handlers/authorize-handler.js';
import Server from '../../lib/server.js';
import TokenHandler from '../../lib/handlers/token-handler.js';
import { describe, expect, it, sinon } from '../test-utils.js';

/**
 * Test `Server`.
 */

describe('Server', function () {
  describe('authenticate()', function () {
    it('calls `handle`', function () {
      const model = {
        getAccessToken: function () {}
      };
      const server = new Server({ model: model });

      sinon
        .stub(AuthenticateHandler.prototype, 'handle')
        .returns(Promise.resolve());

      server.authenticate('foo');

      expect(AuthenticateHandler.prototype.handle.callCount).to.equal(1);
      expect(AuthenticateHandler.prototype.handle.firstCall.args[0]).to.equal(
        'foo'
      );
      AuthenticateHandler.prototype.handle.restore();
    });
  });

  describe('authorize()', function () {
    it('calls `handle`', function () {
      const model = {
        getAccessToken: function () {},
        getClient: function () {},
        saveAuthorizationCode: function () {}
      };
      const server = new Server({ model: model });

      sinon
        .stub(AuthorizeHandler.prototype, 'handle')
        .returns(Promise.resolve());

      server.authorize('foo', 'bar');

      expect(AuthorizeHandler.prototype.handle.callCount).to.equal(1);
      expect(AuthorizeHandler.prototype.handle.firstCall.args[0]).to.equal(
        'foo'
      );
      AuthorizeHandler.prototype.handle.restore();
    });
  });

  describe('token()', function () {
    it('calls `handle`', function () {
      const model = {
        getClient: function () {},
        saveToken: function () {}
      };
      const server = new Server({ model: model });

      sinon.stub(TokenHandler.prototype, 'handle').returns(Promise.resolve());

      server.token('foo', 'bar');

      expect(TokenHandler.prototype.handle.callCount).to.equal(1);
      expect(TokenHandler.prototype.handle.firstCall.args[0]).to.equal('foo');
      TokenHandler.prototype.handle.restore();
    });
  });
});
