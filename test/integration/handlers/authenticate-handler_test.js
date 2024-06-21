'use strict';

/**
 * Module dependencies.
 */

import AccessDeniedError from '../../../lib/errors/access-denied-error.js';
import AuthenticateHandler from '../../../lib/handlers/authenticate-handler.js';
import InvalidArgumentError from '../../../lib/errors/invalid-argument-error.js';
import InvalidRequestError from '../../../lib/errors/invalid-request-error.js';
import InsufficientScopeError from '../../../lib/errors/insufficient-scope-error.js';
import InvalidTokenError from '../../../lib/errors/invalid-token-error.js';
import Request from '../../../lib/request.js';
import Response from '../../../lib/response.js';
import ServerError from '../../../lib/errors/server-error.js';
import UnauthorizedRequestError from '../../../lib/errors/unauthorized-request-error.js';
import { describe, expect, it } from '../../test-utils.js';

/**
 * Test `AuthenticateHandler` integration.
 */

describe('AuthenticateHandler integration', function () {
  describe('constructor()', function () {
    it('throws an error if `options.model` is missing', function () {
      try {
        new AuthenticateHandler();

        expect.fail();
      } catch (e) {
        expect(e)
          .to.be.an.instanceOf(InvalidArgumentError)
          .and.have.a.property('message', 'Missing parameter: `model`');
      }
    });

    it('throws an error if the model does not implement `getAccessToken()`', function () {
      try {
        new AuthenticateHandler({ model: {} });

        expect.fail();
      } catch (e) {
        expect(e)
          .to.be.an.instanceOf(InvalidArgumentError)
          .and.have.a.property(
            'message',
            'Invalid argument: model does not implement `getAccessToken()`'
          );
      }
    });

    it('throws an error if `scope` was given and `addAcceptedScopesHeader()` is missing', function () {
      try {
        new AuthenticateHandler({
          model: { getAccessToken: function () {} },
          scope: ['foobar']
        });

        expect.fail();
      } catch (e) {
        expect(e)
          .to.be.an.instanceOf(InvalidArgumentError)
          .and.have.a.property(
            'message',
            'Missing parameter: `addAcceptedScopesHeader`'
          );
      }
    });

    it('throws an error if `scope` was given and `addAuthorizedScopesHeader()` is missing', function () {
      try {
        new AuthenticateHandler({
          addAcceptedScopesHeader: true,
          model: { getAccessToken: function () {} },
          scope: ['foobar']
        });

        expect.fail();
      } catch (e) {
        expect(e)
          .to.be.an.instanceOf(InvalidArgumentError)
          .and.have.a.property(
            'message',
            'Missing parameter: `addAuthorizedScopesHeader`'
          );
      }
    });

    it('throws an error if `scope` was given and the model does not implement `verifyScope()`', function () {
      try {
        new AuthenticateHandler({
          addAcceptedScopesHeader: true,
          addAuthorizedScopesHeader: true,
          model: { getAccessToken: function () {} },
          scope: ['foobar']
        });

        expect.fail();
      } catch (e) {
        expect(e)
          .to.be.an.instanceOf(InvalidArgumentError)
          .and.have.a.property(
            'message',
            'Invalid argument: model does not implement `verifyScope()`'
          );
      }
    });

    it('sets the `model`', function () {
      const model = { getAccessToken: function () {} };
      const grantType = new AuthenticateHandler({ model: model });

      expect(grantType.model).to.equal(model);
    });

    it('sets the `scope`', function () {
      const model = {
        getAccessToken: function () {},
        verifyScope: function () {}
      };
      const grantType = new AuthenticateHandler({
        addAcceptedScopesHeader: true,
        addAuthorizedScopesHeader: true,
        model: model,
        scope: 'foobar'
      });

      expect(grantType.scope).to.eql(['foobar']);
    });
  });

  describe('handle()', function () {
    it('throws an error if `request` is missing or not a Request instance', async function () {
      class Request {} // intentionally fake
      const values = [undefined, null, {}, [], new Date(), new Request()];
      for (const request of values) {
        const handler = new AuthenticateHandler({
          model: { getAccessToken: function () {} }
        });

        try {
          await handler.handle(request);

          expect.fail();
        } catch (e) {
          expect(e)
            .to.be.an.instanceOf(InvalidArgumentError)
            .and.have.a.property(
              'message',
              'Invalid argument: `request` must be an instance of Request'
            );
        }
      }
    });

    it('throws an error if `response` is missing or not a Response instance', async function () {
      class Response {} // intentionally fake
      const values = [undefined, null, {}, [], new Date(), new Response()];
      const request = new Request({
        body: {},
        headers: { Authorization: 'Bearer foo' },
        method: {},
        query: {}
      });

      for (const response of values) {
        const handler = new AuthenticateHandler({
          model: { getAccessToken: function () {} }
        });
        try {
          await handler.handle(request, response);

          expect.fail();
        } catch (e) {
          expect(e)
            .to.be.an.instanceOf(InvalidArgumentError)
            .and.have.a.property(
              'message',
              'Invalid argument: `response` must be an instance of Response'
            );
        }
      }
    });

    it('sets the `WWW-Authenticate` header if an unauthorized request error is thrown', async function () {
      const model = {
        getAccessToken: function () {
          throw new UnauthorizedRequestError();
        }
      };
      const handler = new AuthenticateHandler({ model: model });
      const request = new Request({
        body: {},
        headers: { Authorization: 'Bearer foo' },
        method: {},
        query: {}
      });
      const response = new Response({ body: {}, headers: {} });

      try {
        await handler.handle(request, response);
        expect.fail();
      } catch (e) {
        expect(response.get('WWW-Authenticate')).to.equal(
          'Bearer realm="Service"'
        );
      }
    });

    it('sets the `WWW-Authenticate` header if an InvalidRequestError is thrown', function () {
      const model = {
        getAccessToken: function () {
          throw new InvalidRequestError();
        }
      };
      const handler = new AuthenticateHandler({ model: model });
      const request = new Request({
        body: {},
        headers: { Authorization: 'Bearer foo' },
        method: {},
        query: {}
      });
      const response = new Response({ body: {}, headers: {} });

      return handler
        .handle(request, response)
        .then(expect.fail)
        .catch(function () {
          expect(response.get('WWW-Authenticate')).to.equal(
            'Bearer realm="Service",error="invalid_request"'
          );
        });
    });

    it('sets the `WWW-Authenticate` header if an InvalidTokenError is thrown', function () {
      const model = {
        getAccessToken: function () {
          throw new InvalidTokenError();
        }
      };
      const handler = new AuthenticateHandler({ model: model });
      const request = new Request({
        body: {},
        headers: { Authorization: 'Bearer foo' },
        method: {},
        query: {}
      });
      const response = new Response({ body: {}, headers: {} });

      return handler
        .handle(request, response)
        .then(expect.fail)
        .catch(function () {
          expect(response.get('WWW-Authenticate')).to.equal(
            'Bearer realm="Service",error="invalid_token"'
          );
        });
    });

    it('sets the `WWW-Authenticate` header if an InsufficientScopeError is thrown', function () {
      const model = {
        getAccessToken: function () {
          throw new InsufficientScopeError();
        }
      };
      const handler = new AuthenticateHandler({ model: model });
      const request = new Request({
        body: {},
        headers: { Authorization: 'Bearer foo' },
        method: {},
        query: {}
      });
      const response = new Response({ body: {}, headers: {} });

      return handler
        .handle(request, response)
        .then(expect.fail)
        .catch(function () {
          expect(response.get('WWW-Authenticate')).to.equal(
            'Bearer realm="Service",error="insufficient_scope"'
          );
        });
    });

    it('throws the error if an oauth error is thrown', function () {
      const model = {
        getAccessToken: function () {
          throw new AccessDeniedError('Cannot request this access token');
        }
      };
      const handler = new AuthenticateHandler({ model: model });
      const request = new Request({
        body: {},
        headers: { Authorization: 'Bearer foo' },
        method: {},
        query: {}
      });
      const response = new Response({ body: {}, headers: {} });

      return handler
        .handle(request, response)
        .then(expect.fail)
        .catch(function (e) {
          expect(e)
            .to.be.an.instanceOf(AccessDeniedError)
            .and.have.a.property('message', 'Cannot request this access token');
        });
    });

    it('throws a server error if a non-oauth error is thrown', function () {
      const model = {
        getAccessToken: function () {
          throw new Error('Unhandled exception');
        }
      };
      const handler = new AuthenticateHandler({ model: model });
      const request = new Request({
        body: {},
        headers: { Authorization: 'Bearer foo' },
        method: {},
        query: {}
      });
      const response = new Response({ body: {}, headers: {} });

      return handler
        .handle(request, response)
        .then(expect.fail)
        .catch(function (e) {
          expect(e)
            .to.be.an.instanceOf(ServerError)
            .and.have.a.property('message', 'Unhandled exception');
        });
    });

    it('returns an access token', function () {
      const accessToken = {
        user: {},
        accessTokenExpiresAt: new Date(new Date().getTime() + 10000)
      };
      const model = {
        getAccessToken: function () {
          return accessToken;
        },
        verifyScope: function () {
          return true;
        }
      };
      const handler = new AuthenticateHandler({
        addAcceptedScopesHeader: true,
        addAuthorizedScopesHeader: true,
        model: model,
        scope: 'foo'
      });
      const request = new Request({
        body: {},
        headers: { Authorization: 'Bearer foo' },
        method: {},
        query: {}
      });
      const response = new Response({ body: {}, headers: {} });

      return handler
        .handle(request, response)
        .then(function (data) {
          expect(data).to.equal(accessToken);
        })
        .catch(expect.fail);
    });
  });

  describe('getTokenFromRequest()', function () {
    it('throws an error if more than one authentication method is used', async function () {
      const handler = new AuthenticateHandler({
        model: { getAccessToken: function () {} }
      });
      const request = new Request({
        body: {},
        headers: { Authorization: 'Bearer foo' },
        method: {},
        query: { access_token: 'foo' }
      });

      try {
        await handler.getTokenFromRequest(request);

        expect.fail();
      } catch (e) {
        expect(e)
          .to.be.an.instanceOf(InvalidRequestError)
          .and.have.a.property(
            'message',
            'Invalid request: only one authentication method is allowed'
          );
      }
    });

    it('throws an error if `accessToken` is missing', async function () {
      const handler = new AuthenticateHandler({
        model: { getAccessToken: function () {} }
      });
      const request = new Request({
        body: {},
        headers: {},
        method: {},
        query: {}
      });

      try {
        await handler.getTokenFromRequest(request);

        expect.fail();
      } catch (e) {
        expect(e)
          .to.be.an.instanceOf(UnauthorizedRequestError)
          .and.have.a.property(
            'message',
            'Unauthorized request: no authentication given'
          );
      }
    });
  });

  describe('getTokenFromRequestHeader()', function () {
    it('throws an error if the token is malformed', async function () {
      const handler = new AuthenticateHandler({
        model: { getAccessToken: function () {} }
      });
      const request = new Request({
        body: {},
        headers: {
          Authorization: 'foobar'
        },
        method: {},
        query: {}
      });

      try {
        await handler.getTokenFromRequestHeader(request);

        expect.fail();
      } catch (e) {
        expect(e)
          .to.be.an.instanceOf(InvalidRequestError)
          .and.have.a.property(
            'message',
            'Invalid request: malformed authorization header'
          );
      }
    });

    it('returns the bearer token', function () {
      const handler = new AuthenticateHandler({
        model: { getAccessToken: function () {} }
      });
      const request = new Request({
        body: {},
        headers: {
          Authorization: 'Bearer foo'
        },
        method: {},
        query: {}
      });

      const bearerToken = handler.getTokenFromRequestHeader(request);

      expect(bearerToken).to.equal('foo');
    });
  });

  describe('getTokenFromRequestQuery()', function () {
    it('throws an error if the query contains a token', async function () {
      const handler = new AuthenticateHandler({
        model: { getAccessToken: function () {} }
      });

      try {
        await handler.getTokenFromRequestQuery();

        expect.fail();
      } catch (e) {
        expect(e)
          .to.be.an.instanceOf(InvalidRequestError)
          .and.have.a.property(
            'message',
            'Invalid request: do not send bearer tokens in query URLs'
          );
      }
    });

    it('returns the bearer token if `allowBearerTokensInQueryString` is true', function () {
      const handler = new AuthenticateHandler({
        allowBearerTokensInQueryString: true,
        model: { getAccessToken: function () {} }
      });

      expect(
        handler.getTokenFromRequestQuery({ query: { access_token: 'foo' } })
      ).to.equal('foo');
    });
  });

  describe('getTokenFromRequestBody()', function () {
    it('throws an error if the method is `GET`', async function () {
      const handler = new AuthenticateHandler({
        model: { getAccessToken: function () {} }
      });
      const request = new Request({
        body: { access_token: 'foo' },
        headers: {},
        method: 'GET',
        query: {}
      });

      try {
        await handler.getTokenFromRequestBody(request);

        expect.fail();
      } catch (e) {
        expect(e)
          .to.be.an.instanceOf(InvalidRequestError)
          .and.have.a.property(
            'message',
            'Invalid request: token may not be passed in the body when using the GET verb'
          );
      }
    });

    it('throws an error if the media type is not `application/x-www-form-urlencoded`', async function () {
      const handler = new AuthenticateHandler({
        model: { getAccessToken: function () {} }
      });
      const request = new Request({
        body: { access_token: 'foo' },
        headers: {},
        method: {},
        query: {}
      });

      try {
        await handler.getTokenFromRequestBody(request);

        expect.fail();
      } catch (e) {
        expect(e)
          .to.be.an.instanceOf(InvalidRequestError)
          .and.have.a.property(
            'message',
            'Invalid request: content must be application/x-www-form-urlencoded'
          );
      }
    });

    it('returns the bearer token', function () {
      const handler = new AuthenticateHandler({
        model: { getAccessToken: function () {} }
      });
      const request = new Request({
        body: { access_token: 'foo' },
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'transfer-encoding': 'chunked'
        },
        method: {},
        query: {}
      });

      expect(handler.getTokenFromRequestBody(request)).to.equal('foo');
    });
  });

  describe('getAccessToken()', function () {
    it('throws an error if `accessToken` is missing', function () {
      const model = {
        getAccessToken: function () {}
      };
      const handler = new AuthenticateHandler({ model: model });

      return handler
        .getAccessToken('foo')
        .then(expect.fail)
        .catch(function (e) {
          expect(e)
            .to.be.an.instanceOf(InvalidTokenError)
            .and.have.a.property(
              'message',
              'Invalid token: access token is invalid'
            );
        });
    });

    it('throws an error if `accessToken.user` is missing', function () {
      const model = {
        getAccessToken: function () {
          return {};
        }
      };
      const handler = new AuthenticateHandler({ model: model });

      return handler
        .getAccessToken('foo')
        .then(expect.fail)
        .catch(function (e) {
          expect(e)
            .to.be.an.instanceOf(ServerError)
            .and.have.a.property(
              'message',
              'Server error: `getAccessToken()` did not return a `user` object'
            );
        });
    });

    it('returns an access token', function () {
      const accessToken = { user: {} };
      const model = {
        getAccessToken: function () {
          return accessToken;
        }
      };
      const handler = new AuthenticateHandler({ model: model });

      return handler
        .getAccessToken('foo')
        .then(function (data) {
          expect(data).to.equal(accessToken);
        })
        .catch(expect.fail);
    });

    it('supports promises', function () {
      const model = {
        getAccessToken: async function () {
          return { user: {} };
        }
      };
      const handler = new AuthenticateHandler({ model: model });

      expect(handler.getAccessToken('foo')).to.be.an.instanceOf(Promise);
    });

    it('supports non-promises', function () {
      const model = {
        getAccessToken: function () {
          return { user: {} };
        }
      };
      const handler = new AuthenticateHandler({ model: model });

      expect(handler.getAccessToken('foo')).to.be.an.instanceOf(Promise);
    });
  });

  describe('validateAccessToken()', function () {
    it('throws an error if `accessToken` is expired', async function () {
      const accessToken = { accessTokenExpiresAt: new Date(new Date() / 2) };
      const handler = new AuthenticateHandler({
        model: { getAccessToken: function () {} }
      });

      try {
        await handler.validateAccessToken(accessToken);

        expect.fail();
      } catch (e) {
        expect(e)
          .to.be.an.instanceOf(InvalidTokenError)
          .and.have.a.property(
            'message',
            'Invalid token: access token has expired'
          );
      }
    });

    it('returns an access token', function () {
      const accessToken = {
        user: {},
        accessTokenExpiresAt: new Date(new Date().getTime() + 10000)
      };
      const handler = new AuthenticateHandler({
        model: { getAccessToken: function () {} }
      });

      expect(handler.validateAccessToken(accessToken)).to.equal(accessToken);
    });
  });

  describe('verifyScope()', function () {
    it('throws an error if `scope` is insufficient', function () {
      const model = {
        getAccessToken: function () {},
        verifyScope: function () {
          return false;
        }
      };
      const handler = new AuthenticateHandler({
        addAcceptedScopesHeader: true,
        addAuthorizedScopesHeader: true,
        model: model,
        scope: 'foo'
      });

      return handler
        .verifyScope(['foo'])
        .then(expect.fail)
        .catch(function (e) {
          expect(e)
            .to.be.an.instanceOf(InsufficientScopeError)
            .and.to.have.property(
              'message',
              'Insufficient scope: authorized scope is insufficient'
            );
        });
    });

    it('supports promises', function () {
      const model = {
        getAccessToken: function () {},
        verifyScope: function () {
          return true;
        }
      };
      const handler = new AuthenticateHandler({
        addAcceptedScopesHeader: true,
        addAuthorizedScopesHeader: true,
        model: model,
        scope: 'foo'
      });

      expect(handler.verifyScope(['foo'])).to.be.an.instanceOf(Promise);
    });

    it('supports non-promises', function () {
      const model = {
        getAccessToken: function () {},
        verifyScope: function () {
          return true;
        }
      };
      const handler = new AuthenticateHandler({
        addAcceptedScopesHeader: true,
        addAuthorizedScopesHeader: true,
        model: model,
        scope: 'foo'
      });

      expect(handler.verifyScope(['foo'])).to.be.an.instanceOf(Promise);
    });
  });

  describe('updateResponse()', function () {
    it('does not set the `X-Accepted-OAuth-Scopes` header if `scope` is not specified', function () {
      const model = {
        getAccessToken: function () {},
        verifyScope: function () {}
      };
      const handler = new AuthenticateHandler({
        addAcceptedScopesHeader: true,
        addAuthorizedScopesHeader: false,
        model: model
      });
      const response = new Response({ body: {}, headers: {} });

      handler.updateResponse(response, { scope: ['foo', 'biz'] });

      expect(response.headers).to.not.have.property('x-accepted-oauth-scopes');
    });

    it('sets the `X-Accepted-OAuth-Scopes` header if `scope` is specified', function () {
      const model = {
        getAccessToken: function () {},
        verifyScope: function () {}
      };
      const handler = new AuthenticateHandler({
        addAcceptedScopesHeader: true,
        addAuthorizedScopesHeader: false,
        model: model,
        scope: 'foo bar'
      });
      const response = new Response({ body: {}, headers: {} });

      handler.updateResponse(response, { scope: ['foo', 'biz'] });

      expect(response.get('X-Accepted-OAuth-Scopes')).to.equal('foo bar');
    });

    it('does not set the `X-Authorized-OAuth-Scopes` header if `scope` is not specified', function () {
      const model = {
        getAccessToken: function () {},
        verifyScope: function () {}
      };
      const handler = new AuthenticateHandler({
        addAcceptedScopesHeader: false,
        addAuthorizedScopesHeader: true,
        model: model
      });
      const response = new Response({ body: {}, headers: {} });

      handler.updateResponse(response, { scope: ['foo', 'biz'] });

      expect(response.headers).to.not.have.property('x-oauth-scopes');
    });

    it('sets the `X-Authorized-OAuth-Scopes` header', function () {
      const model = {
        getAccessToken: function () {},
        verifyScope: function () {}
      };
      const handler = new AuthenticateHandler({
        addAcceptedScopesHeader: false,
        addAuthorizedScopesHeader: true,
        model: model,
        scope: 'foo bar'
      });
      const response = new Response({ body: {}, headers: {} });

      handler.updateResponse(response, { scope: ['foo', 'biz'] });

      expect(response.get('X-OAuth-Scopes')).to.equal('foo biz');
    });
  });
});
