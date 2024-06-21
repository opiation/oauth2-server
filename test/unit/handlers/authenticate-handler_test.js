'use strict';

/**
 * Module dependencies.
 */

import AuthenticateHandler from '../../../lib/handlers/authenticate-handler.js';
import InvalidRequestError from '../../../lib/errors/invalid-request-error.js';
import Request from '../../../lib/request.js';
import ServerError from '../../../lib/errors/server-error.js';
import { describe, expect, it, sinon } from '../../test-utils.js';

/**
 * Test `AuthenticateHandler`.
 */

describe('AuthenticateHandler', function () {
  describe('getTokenFromRequest()', function () {
    describe('with bearer token in the request authorization header', function () {
      it('throws an error if the token is malformed', () => {
        const handler = new AuthenticateHandler({
          model: { getAccessToken() {} }
        });
        const request = new Request({
          body: {},
          headers: {
            Authorization: 'foo Bearer bar'
          },
          method: 'ANY',
          query: {}
        });

        try {
          handler.getTokenFromRequestHeader(request);

          expect.fail('expect.fail', '');
        } catch (e) {
          expect(e)
            .to.be.an.instanceOf(InvalidRequestError)
            .and.to.have.a.property(
              'message',
              'Invalid request: malformed authorization header'
            );
        }
      });
    });

    describe('with bearer token in the request authorization header', function () {
      it('calls `getTokenFromRequestHeader()`', function () {
        const handler = new AuthenticateHandler({
          model: { getAccessToken: function () {} }
        });
        const request = new Request({
          body: {},
          headers: { Authorization: 'Bearer foo' },
          method: {},
          query: {}
        });

        sinon.stub(handler, 'getTokenFromRequestHeader');

        handler.getTokenFromRequest(request);

        expect(handler.getTokenFromRequestHeader.callCount).to.equal(1);
        expect(handler.getTokenFromRequestHeader.firstCall.args).to.include(
          request
        );
        handler.getTokenFromRequestHeader.restore();
      });
    });

    describe('with bearer token in the request query', function () {
      it('calls `getTokenFromRequestQuery()`', function () {
        const handler = new AuthenticateHandler({
          model: { getAccessToken: function () {} }
        });
        const request = new Request({
          body: {},
          headers: {},
          method: {},
          query: { access_token: 'foo' }
        });

        sinon.stub(handler, 'getTokenFromRequestQuery');

        handler.getTokenFromRequest(request);

        expect(handler.getTokenFromRequestQuery.callCount).to.equal(1);
        expect(handler.getTokenFromRequestQuery.firstCall.args).to.include(
          request
        );
        handler.getTokenFromRequestQuery.restore();
      });
    });

    describe('with bearer token in the request body', function () {
      it('calls `getTokenFromRequestBody()`', function () {
        const handler = new AuthenticateHandler({
          model: { getAccessToken: function () {} }
        });
        const request = new Request({
          body: { access_token: 'foo' },
          headers: {},
          method: {},
          query: {}
        });

        sinon.stub(handler, 'getTokenFromRequestBody');

        handler.getTokenFromRequest(request);

        expect(handler.getTokenFromRequestBody.callCount).to.equal(1);
        expect(handler.getTokenFromRequestBody.firstCall.args).to.include(
          request
        );
        handler.getTokenFromRequestBody.restore();
      });
    });
  });

  describe('getAccessToken()', function () {
    it('calls `model.getAccessToken()`', function () {
      const model = {
        getAccessToken: sinon.stub().returns({ user: {} })
      };
      const handler = new AuthenticateHandler({ model: model });

      return handler
        .getAccessToken('foo')
        .then(function () {
          expect(model.getAccessToken.callCount).to.equal(1);
          expect(model.getAccessToken.firstCall).to.deep.include({
            args: ['foo'],
            thisValue: model
          });
        })
        .catch(expect.fail);
    });
  });

  describe('validateAccessToken()', function () {
    it('fails if token has no valid `accessTokenExpiresAt` date', function () {
      const model = {
        getAccessToken: function () {}
      };
      const handler = new AuthenticateHandler({ model: model });

      let failed = false;
      try {
        handler.validateAccessToken({
          user: {}
        });
      } catch (err) {
        expect(err).to.be.an.instanceOf(ServerError);
        failed = true;
      }
      expect(failed).to.be.true;
    });

    it('succeeds if token has valid `accessTokenExpiresAt` date', function () {
      const model = {
        getAccessToken: function () {}
      };
      const handler = new AuthenticateHandler({ model: model });
      try {
        handler.validateAccessToken({
          user: {},
          accessTokenExpiresAt: new Date(new Date().getTime() + 10000)
        });
      } catch (err) {
        expect.fail();
      }
    });
  });

  describe('verifyScope()', function () {
    it('calls `model.getAccessToken()` if scope is defined', function () {
      const model = {
        getAccessToken: function () {},
        verifyScope: sinon.stub().returns(true)
      };
      const handler = new AuthenticateHandler({
        addAcceptedScopesHeader: true,
        addAuthorizedScopesHeader: true,
        model: model,
        scope: 'bar'
      });

      return handler
        .verifyScope(['foo'])
        .then(function () {
          expect(model.verifyScope.callCount).to.equal(1);
          expect(model.verifyScope.firstCall).to.deep.include({
            args: [['foo'], ['bar']],
            thisValue: model
          });
        })
        .catch(expect.fail);
    });
  });
});
