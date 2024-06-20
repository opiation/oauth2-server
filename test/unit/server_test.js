'use strict';

/**
 * Module dependencies.
 */

import AuthenticateHandler from '../../lib/handlers/authenticate-handler.js';
import AuthorizeHandler from '../../lib/handlers/authorize-handler.js';
import Server from '../../lib/server.js';
import TokenHandler from '../../lib/handlers/token-handler.js';
import sinon from 'sinon';

/**
 * Test `Server`.
 */

describe('Server', function () {
  describe('authenticate()', function () {
    it('should call `handle`', function () {
      const model = {
        getAccessToken: function () {},
      };
      const server = new Server({ model: model });

      sinon
        .stub(AuthenticateHandler.prototype, 'handle')
        .returns(Promise.resolve());

      server.authenticate('foo');

      AuthenticateHandler.prototype.handle.callCount.should.equal(1);
      AuthenticateHandler.prototype.handle.firstCall.args[0].should.equal(
        'foo'
      );
      AuthenticateHandler.prototype.handle.restore();
    });
  });

  describe('authorize()', function () {
    it('should call `handle`', function () {
      const model = {
        getAccessToken: function () {},
        getClient: function () {},
        saveAuthorizationCode: function () {},
      };
      const server = new Server({ model: model });

      sinon
        .stub(AuthorizeHandler.prototype, 'handle')
        .returns(Promise.resolve());

      server.authorize('foo', 'bar');

      AuthorizeHandler.prototype.handle.callCount.should.equal(1);
      AuthorizeHandler.prototype.handle.firstCall.args[0].should.equal('foo');
      AuthorizeHandler.prototype.handle.restore();
    });
  });

  describe('token()', function () {
    it('should call `handle`', function () {
      const model = {
        getClient: function () {},
        saveToken: function () {},
      };
      const server = new Server({ model: model });

      sinon.stub(TokenHandler.prototype, 'handle').returns(Promise.resolve());

      server.token('foo', 'bar');

      TokenHandler.prototype.handle.callCount.should.equal(1);
      TokenHandler.prototype.handle.firstCall.args[0].should.equal('foo');
      TokenHandler.prototype.handle.restore();
    });
  });
});
