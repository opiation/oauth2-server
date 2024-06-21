'use strict';

/**
 * Module dependencies.
 */

import AccessDeniedError from '../../../lib/errors/access-denied-error.js';
import AuthenticateHandler from '../../../lib/handlers/authenticate-handler.js';
import AuthorizeHandler from '../../../lib/handlers/authorize-handler.js';
import CodeResponseType from '../../../lib/response-types/code-response-type.js';
import InvalidArgumentError from '../../../lib/errors/invalid-argument-error.js';
import InvalidClientError from '../../../lib/errors/invalid-client-error.js';
import InvalidRequestError from '../../../lib/errors/invalid-request-error.js';
import InvalidScopeError from '../../../lib/errors/invalid-scope-error.js';
import UnsupportedResponseTypeError from '../../../lib/errors/unsupported-response-type-error.js';
import Request from '../../../lib/request.js';
import Response from '../../../lib/response.js';
import ServerError from '../../../lib/errors/server-error.js';
import UnauthorizedClientError from '../../../lib/errors/unauthorized-client-error.js';
import url from 'node:url';
import { describe, expect, it } from '../../test-utils.js';

const createModel = (model = {}) => {
  return {
    getAccessToken: () => expect.fail(),
    getClient: () => expect.fail(),
    saveAuthorizationCode: () => expect.fail(),
    ...model
  };
};

/**
 * Test `AuthorizeHandler` integration.
 */

describe('AuthorizeHandler integration', function () {
  describe('constructor()', function () {
    it('throws an error if `options.authorizationCodeLifetime` is missing', function () {
      try {
        new AuthorizeHandler();
        expect.fail();
      } catch (e) {
        expect(e)
          .to.be.an.instanceOf(InvalidArgumentError)
          .and.to.have.a.property(
            'message',
            'Missing parameter: `authorizationCodeLifetime`'
          );
      }
    });

    it('throws an error if `options.model` is missing', function () {
      try {
        new AuthorizeHandler({ authorizationCodeLifetime: 120 });
        expect.fail();
      } catch (e) {
        expect(e)
          .to.be.an.instanceOf(InvalidArgumentError)
          .and.to.have.a.property('message', 'Missing parameter: `model`');
      }
    });

    it('throws an error if the model does not implement `getClient()`', function () {
      try {
        new AuthorizeHandler({ authorizationCodeLifetime: 120, model: {} });
        expect.fail();
      } catch (e) {
        expect(e)
          .to.be.an.instanceOf(InvalidArgumentError)
          .and.to.have.a.property(
            'message',
            'Invalid argument: model does not implement `getClient()`'
          );
      }
    });

    it('throws an error if the model does not implement `saveAuthorizationCode()`', function () {
      try {
        new AuthorizeHandler({
          authorizationCodeLifetime: 120,
          model: { getClient: () => expect.fail() }
        });
        expect.fail();
      } catch (e) {
        expect(e)
          .to.be.an.instanceOf(InvalidArgumentError)
          .and.to.have.a.property(
            'message',
            'Invalid argument: model does not implement `saveAuthorizationCode()`'
          );
      }
    });

    it('throws an error if the model does not implement `getAccessToken()`', function () {
      const model = {
        getClient: () => expect.fail(),
        saveAuthorizationCode: () => expect.fail()
      };

      try {
        new AuthorizeHandler({ authorizationCodeLifetime: 120, model });

        expect.fail();
      } catch (e) {
        expect(e)
          .to.be.an.instanceOf(InvalidArgumentError)
          .and.to.have.a.property(
            'message',
            'Invalid argument: model does not implement `getAccessToken()`'
          );
      }
    });

    it('sets the `authorizationCodeLifetime`', function () {
      const model = createModel();
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model
      });

      expect(handler.authorizationCodeLifetime).to.equal(120);
    });

    it('throws if the custom `authenticateHandler` does not implement a `handle` method', function () {
      const model = createModel();
      const authenticateHandler = {}; // misses handle() method

      try {
        new AuthorizeHandler({
          authenticateHandler,
          authorizationCodeLifetime: 120,
          model
        });
        expect.fail();
      } catch (e) {
        expect(e)
          .to.be.an.instanceOf(InvalidArgumentError)
          .and.to.have.a.property(
            'message',
            'Invalid argument: authenticateHandler does not implement `handle()`'
          );
      }
    });

    it('sets the default `authenticateHandler`, if no custom one is passed', function () {
      const model = createModel();
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model
      });
      expect(handler.authenticateHandler).to.be.an.instanceOf(
        AuthenticateHandler
      );
    });

    it('sets the custom `authenticateHandler`, if valid', function () {
      const model = createModel();

      class CustomAuthenticateHandler {
        async handle() {}
      }

      const authenticateHandler = new CustomAuthenticateHandler();
      const handler = new AuthorizeHandler({
        authenticateHandler,
        authorizationCodeLifetime: 120,
        model
      });
      expect(handler.authenticateHandler)
        .to.be.an.instanceOf(CustomAuthenticateHandler)
        .and.not.be.an.instanceOf(AuthenticateHandler);
    });

    it('sets the `model`', function () {
      const model = createModel();
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model
      });

      expect(handler.model).to.equal(model);
    });
  });

  describe('handle()', function () {
    it('throws an error if `request` is missing', async function () {
      const model = createModel();
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model
      });

      try {
        await handler.handle();
        expect.fail();
      } catch (e) {
        expect(e)
          .to.be.an.instanceOf(InvalidArgumentError)
          .and.to.have.a.property(
            'message',
            'Invalid argument: `request` must be an instance of Request'
          );
      }
    });

    it('throws an error if `response` is missing', async function () {
      const model = createModel();
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model
      });
      const request = new Request({
        body: {},
        headers: {},
        method: {},
        query: {}
      });

      try {
        await handler.handle(request);
        expect.fail();
      } catch (e) {
        expect(e)
          .to.be.an.instanceOf(InvalidArgumentError)
          .and.to.have.a.property(
            'message',
            'Invalid argument: `response` must be an instance of Response'
          );
      }
    });

    it('redirects to an error response if user denied access', async function () {
      const client = {
        id: 'client-12345',
        grants: ['authorization_code'],
        redirectUris: ['http://example.com/cb']
      };
      const model = createModel({
        getAccessToken: async function (_token) {
          expect(_token).to.equal('foobarbazmootoken');
          return {
            user: {},
            accessTokenExpiresAt: new Date(new Date().getTime() + 10000)
          };
        },
        getClient: async function (clientId, clientSecret) {
          expect(clientId).to.equal(client.id);
          expect(clientSecret).to.be.null;
          return { ...client };
        }
      });
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model
      });
      const request = new Request({
        body: {
          client_id: client.id,
          response_type: 'code'
        },
        method: {},
        headers: {
          Authorization: 'Bearer foobarbazmootoken'
        },
        query: {
          state: 'foobar',
          allowed: 'false'
        }
      });
      const response = new Response({ body: {}, headers: {} });

      try {
        await handler.handle(request, response);
        expect.fail();
      } catch (e) {
        expect(e)
          .to.be.an.instanceOf(AccessDeniedError)
          .and.to.have.a.property(
            'message',
            'Access denied: user denied access to application'
          );
        expect(response.get('location')).to.equal(
          'http://example.com/cb?error=access_denied&error_description=Access%20denied%3A%20user%20denied%20access%20to%20application&state=foobar'
        );
      }
    });

    it('redirects to an error response if a non-oauth error is thrown', async function () {
      const model = createModel({
        getAccessToken: async function () {
          return {
            user: {},
            accessTokenExpiresAt: new Date(new Date().getTime() + 10000)
          };
        },
        getClient: async function () {
          return {
            grants: ['authorization_code'],
            redirectUris: ['http://example.com/cb']
          };
        },
        saveAuthorizationCode: async function () {
          throw new CustomError('Unhandled exception');
        }
      });
      class CustomError extends Error {}
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model
      });
      const request = new Request({
        body: {
          client_id: 12345,
          response_type: 'code'
        },
        headers: {
          Authorization: 'Bearer foo'
        },
        method: {},
        query: {
          state: 'foobar'
        }
      });
      const response = new Response({ body: {}, headers: {} });

      try {
        await handler.handle(request, response);
        expect.fail();
      } catch (e) {
        expect(e)
          .to.be.an.instanceOf(ServerError)
          .and.to.have.a.property('message', 'Unhandled exception');
        expect(response.get('location')).to.equal(
          'http://example.com/cb?error=server_error&error_description=Unhandled%20exception&state=foobar'
        );
      }
    });

    it('redirects to an error response if an oauth error is thrown', async function () {
      const model = createModel({
        getAccessToken: async function () {
          return {
            user: {},
            accessTokenExpiresAt: new Date(new Date().getTime() + 10000)
          };
        },
        getClient: async function () {
          return {
            grants: ['authorization_code'],
            redirectUris: ['http://example.com/cb']
          };
        },
        saveAuthorizationCode: async function () {
          throw new AccessDeniedError('Cannot request this auth code');
        }
      });
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model
      });
      const request = new Request({
        body: {
          client_id: 12345,
          response_type: 'code'
        },
        headers: {
          Authorization: 'Bearer foo'
        },
        method: {},
        query: {
          state: 'foobar'
        }
      });
      const response = new Response({ body: {}, headers: {} });

      try {
        await handler.handle(request, response);
        expect.fail();
      } catch (e) {
        expect(e)
          .to.be.an.instanceOf(AccessDeniedError)
          .and.to.have.a.property('message', 'Cannot request this auth code');
        expect(response.get('location')).to.equal(
          'http://example.com/cb?error=access_denied&error_description=Cannot%20request%20this%20auth%20code&state=foobar'
        );
      }
    });

    it('redirects to a successful response with `code` and `state` if successful', async function () {
      const client = {
        id: 'client-12343434',
        grants: ['authorization_code'],
        redirectUris: ['http://example.com/cb']
      };
      const model = createModel({
        getAccessToken: async function (_token) {
          expect(_token).to.equal('foobarbaztokenmoo');
          return {
            client,
            user: {},
            accessTokenExpiresAt: new Date(new Date().getTime() + 10000)
          };
        },
        getClient: async function (clientId, clientSecret) {
          expect(clientId).to.equal(client.id);
          expect(clientSecret).to.be.null;
          return { ...client };
        },
        saveAuthorizationCode: async function () {
          return {
            authorizationCode: 'fooobar-long-authzcode-?',
            client
          };
        }
      });
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model
      });
      const request = new Request({
        body: {
          client_id: client.id,
          response_type: 'code'
        },
        headers: {
          Authorization: 'Bearer foobarbaztokenmoo'
        },
        method: {},
        query: {
          state: 'foobarbazstatemoo'
        }
      });
      const response = new Response({ body: {}, headers: {} });

      const data = await handler.handle(request, response);

      expect(data).to.deep.equal({
        authorizationCode: 'fooobar-long-authzcode-?',
        client
      });
      expect(response.status).to.equal(302);
      expect(response.get('location')).to.equal(
        'http://example.com/cb?code=fooobar-long-authzcode-%3F&state=foobarbazstatemoo'
      );
    });

    it('redirects to an error response if `scope` is invalid', async function () {
      const model = createModel({
        getAccessToken: async function () {
          return {
            user: {},
            accessTokenExpiresAt: new Date(new Date().getTime() + 10000)
          };
        },
        getClient: async function () {
          return {
            grants: ['authorization_code'],
            redirectUris: ['http://example.com/cb']
          };
        },
        saveAuthorizationCode: async function () {
          return {};
        }
      });
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model
      });
      const request = new Request({
        body: {
          client_id: 12345,
          response_type: 'code'
        },
        headers: {
          Authorization: 'Bearer foo'
        },
        method: {},
        query: {
          scope: [],
          state: 'foobar'
        }
      });
      const response = new Response({ body: {}, headers: {} });

      try {
        await handler.handle(request, response);
        expect.fail();
      } catch (e) {
        expect(e)
          .to.be.an.instanceOf(InvalidScopeError)
          .and.to.have.a.property('message', 'Invalid parameter: `scope`');
        expect(response.status).to.equal(302);
        expect(response.get('location')).to.equal(
          'http://example.com/cb?error=invalid_scope&error_description=Invalid%20parameter%3A%20%60scope%60&state=foobar'
        );
      }
    });

    it('redirects to a successful response if `model.validateScope` is not defined', async function () {
      const client = {
        grants: ['authorization_code'],
        redirectUris: ['http://example.com/cb']
      };
      const model = {
        getAccessToken: function () {
          return {
            client: client,
            user: {},
            accessTokenExpiresAt: new Date(new Date().getTime() + 10000)
          };
        },
        getClient: function () {
          return client;
        },
        saveAuthorizationCode: function () {
          return { authorizationCode: 'fooobar-long-authzcode-?', client };
        }
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model
      });
      const request = new Request({
        body: {
          client_id: 12345,
          response_type: 'code'
        },
        headers: {
          Authorization: 'Bearer foo'
        },
        method: {},
        query: {
          scope: 'read',
          state: 'foobarbazstatemoo'
        }
      });
      const response = new Response({ body: {}, headers: {} });

      const data = await handler.handle(request, response);

      expect(data).to.deep.equal({
        authorizationCode: 'fooobar-long-authzcode-?',
        client
      });
      expect(response.status).to.equal(302);
      expect(response.get('location')).to.equal(
        'http://example.com/cb?code=fooobar-long-authzcode-%3F&state=foobarbazstatemoo'
      );
    });

    it('redirects to an error response if `scope` is insufficient (validateScope)', async function () {
      const client = {
        id: 12345,
        grants: ['authorization_code'],
        redirectUris: ['http://example.com/cb']
      };
      const model = {
        getAccessToken: async function () {
          return {
            client: client,
            user: { name: 'foouser' },
            accessTokenExpiresAt: new Date(new Date().getTime() + 10000)
          };
        },
        getClient: async function () {
          return client;
        },
        saveAuthorizationCode: async function () {
          return { authorizationCode: 12345, client };
        },
        validateScope: async function (_user, _client, _scope) {
          expect(_scope).eql(['read']);
          return false;
        }
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model
      });
      const request = new Request({
        body: {
          client_id: 12345,
          response_type: 'code'
        },
        headers: {
          Authorization: 'Bearer foo'
        },
        method: {},
        query: {
          scope: 'read',
          state: 'foobar'
        }
      });
      const response = new Response({ body: {}, headers: {} });

      try {
        await handler.handle(request, response);
        expect.fail();
      } catch (e) {
        expect(e)
          .to.be.an.instanceOf(InvalidScopeError)
          .and.to.have.a.property(
            'message',
            'Invalid scope: Requested scope is invalid'
          );
        expect(response.status).to.equal(302);
        expect(response.get('location')).to.equal(
          'http://example.com/cb?error=invalid_scope&error_description=Invalid%20scope%3A%20Requested%20scope%20is%20invalid&state=foobar'
        );
      }
    });

    it('redirects to an error response if `state` is missing', async function () {
      const model = createModel({
        getAccessToken: async function () {
          return {
            user: {},
            accessTokenExpiresAt: new Date(new Date().getTime() + 10000)
          };
        },
        getClient: async function () {
          return {
            grants: ['authorization_code'],
            redirectUris: ['http://example.com/cb']
          };
        },
        saveAuthorizationCode: async function () {
          throw new AccessDeniedError('Cannot request this auth code');
        }
      });
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model
      });
      const request = new Request({
        body: {
          client_id: 12345,
          response_type: 'code'
        },
        headers: {
          Authorization: 'Bearer foo'
        },
        method: {},
        query: {}
      });
      const response = new Response({ body: {}, headers: {} });

      try {
        await handler.handle(request, response);
        expect.fail();
      } catch (e) {
        expect(e)
          .to.be.an.instanceOf(InvalidRequestError)
          .and.to.have.a.property('message', 'Missing parameter: `state`');
        expect(response.status).to.equal(302);
        expect(response.get('location')).to.equal(
          'http://example.com/cb?error=invalid_request&error_description=Missing%20parameter%3A%20%60state%60'
        );
      }
    });

    it('redirects to an error response if `response_type` is invalid', async function () {
      const model = {
        getAccessToken: async function () {
          return {
            user: {},
            accessTokenExpiresAt: new Date(new Date().getTime() + 10000)
          };
        },
        getClient: async function () {
          return {
            grants: ['authorization_code'],
            redirectUris: ['http://example.com/cb']
          };
        },
        saveAuthorizationCode: () => expect.fail() // expected to fail before call
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model
      });
      const request = new Request({
        body: {
          client_id: 12345,
          response_type: 'test'
        },
        headers: {
          Authorization: 'Bearer foo'
        },
        method: {},
        query: {
          state: 'foobar'
        }
      });
      const response = new Response({ body: {}, headers: {} });

      try {
        await handler.handle(request, response);
        expect.fail();
      } catch (e) {
        expect(e)
          .to.be.an.instanceOf(UnsupportedResponseTypeError)
          .and.to.have.a.property(
            'message',
            'Unsupported response type: `response_type` is not supported'
          );
        expect(response.status).to.equal(302);
        expect(response.get('location')).to.equal(
          'http://example.com/cb?error=unsupported_response_type&error_description=Unsupported%20response%20type%3A%20%60response_type%60%20is%20not%20supported&state=foobar'
        );
      }
    });

    it('returns the `code` if successful', async function () {
      const client = {
        grants: ['authorization_code'],
        redirectUris: ['http://example.com/cb']
      };
      const model = {
        getAccessToken: async function () {
          return {
            client: client,
            user: {},
            accessTokenExpiresAt: new Date(new Date().getTime() + 10000)
          };
        },
        getClient: async function () {
          return client;
        },
        generateAuthorizationCode: async () => 'some-code',
        saveAuthorizationCode: async function (code) {
          return { authorizationCode: code.authorizationCode, client: client };
        }
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model
      });
      const request = new Request({
        body: {
          client_id: 12345,
          response_type: 'code'
        },
        headers: {
          Authorization: 'Bearer foo'
        },
        method: {},
        query: {
          state: 'foobar'
        }
      });
      const response = new Response({ body: {}, headers: {} });

      const data = await handler.handle(request, response);

      expect(data).to.eql({
        authorizationCode: 'some-code',
        client: client
      });
    });

    it('returns the `code` if successful (full model implementation)', async function () {
      const user = { name: 'fooUser' };
      const state = 'fooobarstatebaz';
      const scope = ['read'];
      const client = {
        id: 'client-1322132131',
        grants: ['authorization_code'],
        redirectUris: ['http://example.com/cb']
      };
      const authorizationCode = 'long-authz-code';
      const accessTokenDoc = {
        accessToken: 'some-access-token-code',
        client,
        user,
        scope,
        accessTokenExpiresAt: new Date(new Date().getTime() + 10000)
      };
      const model = {
        getClient: async function (clientId, clientSecret) {
          expect(clientId).to.equal(client.id);
          expect(clientSecret).to.be.null;
          return { ...client };
        },
        getAccessToken: async function (_token) {
          expect(_token).to.equal(accessTokenDoc.accessToken);
          return { ...accessTokenDoc };
        },
        verifyScope: async function (_tokenDoc, _scope) {
          expect(_tokenDoc).to.equal(accessTokenDoc);
          expect(_scope).to.eql(accessTokenDoc.scope);
          return true;
        },
        validateScope: async function (_user, _client, _scope) {
          expect(_user).to.deep.equal(user);
          expect(_client).to.deep.equal(client);
          expect(_scope).to.eql(scope);
          return _scope;
        },
        generateAuthorizationCode: async function (_client, _user, _scope) {
          expect(_user).to.deep.equal(user);
          expect(_client).to.deep.equal(client);
          expect(_scope).to.eql(scope);
          return authorizationCode;
        },
        saveAuthorizationCode: async function (code, _client, _user) {
          expect(code.authorizationCode).to.equal(authorizationCode);
          expect(code.expiresAt).to.be.instanceOf(Date);
          expect(_user).to.deep.equal(user);
          expect(_client).to.deep.equal(client);
          return { ...code, client, user };
        }
      };

      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model
      });
      const request = new Request({
        body: {
          client_id: client.id,
          response_type: 'code'
        },
        headers: {
          Authorization: `Bearer ${accessTokenDoc.accessToken}`
        },
        method: {},
        query: { state, scope: scope.join(' ') }
      });

      const response = new Response({ body: {}, headers: {} });
      const data = await handler.handle(request, response);
      expect(data.client).to.deep.equal(client);
      expect(data.expiresAt).to.be.instanceOf(Date);
      expect(data.redirectUri).to.deep.equal(client.redirectUris[0]);
      expect(data.scope).to.deep.equal(scope);
      expect(data.user).to.deep.equal(user);
      expect(response.status).to.equal(302);
      expect(response.get('location')).to.equal(
        'http://example.com/cb?code=long-authz-code&state=fooobarstatebaz'
      );
    });

    it('supports a custom `authenticateHandler`', async function () {
      const user = { name: 'user1' };
      const authenticateHandler = {
        handle: async function () {
          // all good
          return { ...user };
        }
      };
      const client = {
        grants: ['authorization_code'],
        redirectUris: ['http://example.com/cb']
      };
      const model = {
        getAccessToken: async function () {
          return {
            client: client,
            user: {},
            accessTokenExpiresAt: new Date(new Date().getTime() + 10000)
          };
        },
        getClient: async function () {
          return client;
        },
        generateAuthorizationCode: async () => 'some-code',
        saveAuthorizationCode: async function (code) {
          return { authorizationCode: code.authorizationCode, client: client };
        }
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model,
        authenticateHandler
      });
      const request = new Request({
        body: {
          client_id: 12345,
          response_type: 'code'
        },
        headers: {
          Authorization: 'Bearer foo'
        },
        method: {},
        query: {
          state: 'foobar'
        }
      });
      const response = new Response({ body: {}, headers: {} });

      const data = await handler.handle(request, response);
      expect(data).to.eql({
        authorizationCode: 'some-code',
        client: client
      });
    });
  });

  describe('generateAuthorizationCode()', function () {
    it('returns an auth code', function () {
      const model = {
        getAccessToken: function () {},
        getClient: function () {},
        saveAuthorizationCode: function () {}
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model
      });

      return handler
        .generateAuthorizationCode()
        .then(function (data) {
          expect(data).to.be.a.sha256();
        })
        .catch(expect.fail);
    });

    it('supports promises', function () {
      const model = {
        generateAuthorizationCode: async function () {
          return {};
        },
        getAccessToken: function () {},
        getClient: function () {},
        saveAuthorizationCode: function () {}
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model
      });

      expect(handler.generateAuthorizationCode()).to.be.an.instanceOf(Promise);
    });

    it('supports non-promises', function () {
      const model = {
        generateAuthorizationCode: function () {
          return {};
        },
        getAccessToken: function () {},
        getClient: function () {},
        saveAuthorizationCode: function () {}
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model
      });

      expect(handler.generateAuthorizationCode()).to.be.an.instanceOf(Promise);
    });
  });

  describe('getAuthorizationCodeLifetime()', function () {
    it('returns a date', function () {
      const model = {
        getAccessToken: function () {},
        getClient: function () {},
        saveAuthorizationCode: function () {}
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model
      });

      expect(handler.getAuthorizationCodeLifetime()).to.be.an.instanceOf(Date);
    });
  });

  describe('validateRedirectUri()', function () {
    it('supports empty method', function () {
      const model = {
        getAccessToken: function () {},
        getClient: function () {},
        saveAuthorizationCode: function () {}
      };

      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model
      });

      expect(
        handler.validateRedirectUri('http://example.com/a', {
          redirectUris: ['http://example.com/a']
        })
      ).to.be.an.instanceOf(Promise);
    });

    it('supports promises', function () {
      const model = {
        getAccessToken: function () {},
        getClient: function () {},
        saveAuthorizationCode: function () {},
        validateRedirectUri: async function () {
          return true;
        }
      };

      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model
      });

      expect(
        handler.validateRedirectUri('http://example.com/a', {})
      ).to.be.an.instanceOf(Promise);
    });

    it('supports non-promises', function () {
      const model = {
        getAccessToken: function () {},
        getClient: function () {},
        saveAuthorizationCode: function () {},
        validateRedirectUri: function () {
          return true;
        }
      };

      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model
      });

      expect(
        handler.validateRedirectUri('http://example.com/a', {})
      ).to.be.an.instanceOf(Promise);
    });
  });

  describe('getClient()', function () {
    it('throws an error if `client_id` is missing', async function () {
      const model = {
        getAccessToken: function () {},
        getClient: function () {},
        saveAuthorizationCode: function () {}
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model
      });
      const request = new Request({
        body: { response_type: 'code' },
        headers: {},
        method: {},
        query: {}
      });

      try {
        await handler.getClient(request);

        expect.fail();
      } catch (e) {
        expect(e)
          .to.be.an.instanceOf(InvalidRequestError)
          .and.to.have.a.property('message', 'Missing parameter: `client_id`');
      }
    });

    it('throws an error if `client_id` is invalid', async function () {
      const model = {
        getAccessToken: function () {},
        getClient: function () {},
        saveAuthorizationCode: function () {}
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model
      });
      const request = new Request({
        body: { client_id: 'øå€£‰', response_type: 'code' },
        headers: {},
        method: {},
        query: {}
      });

      try {
        await handler.getClient(request);

        expect.fail();
      } catch (e) {
        expect(e)
          .to.be.an.instanceOf(InvalidRequestError)
          .and.to.have.a.property('message', 'Invalid parameter: `client_id`');
      }
    });

    it('throws an error if `client.redirectUri` is invalid', async function () {
      const model = {
        getAccessToken: function () {},
        getClient: function () {},
        saveAuthorizationCode: function () {}
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model
      });
      const request = new Request({
        body: {
          client_id: 12345,
          response_type: 'code',
          redirect_uri: 'foobar'
        },
        headers: {},
        method: {},
        query: {}
      });

      try {
        await handler.getClient(request);

        expect.fail();
      } catch (e) {
        expect(e)
          .to.be.an.instanceOf(InvalidRequestError)
          .and.to.have.a.property(
            'message',
            'Invalid request: `redirect_uri` is not a valid URI'
          );
      }
    });

    it('throws an error if `client` is missing', function () {
      const model = {
        getAccessToken: function () {},
        getClient: function () {},
        saveAuthorizationCode: function () {}
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model
      });
      const request = new Request({
        body: { client_id: 12345, response_type: 'code' },
        headers: {},
        method: {},
        query: {}
      });

      return handler
        .getClient(request)
        .then(expect.fail)
        .catch(function (e) {
          expect(e)
            .to.be.an.instanceOf(InvalidClientError)
            .and.to.have.a.property(
              'message',
              'Invalid client: client credentials are invalid'
            );
        });
    });

    it('throws an error if `client.grants` is missing', function () {
      const model = {
        getAccessToken: function () {},
        getClient: function () {
          return {};
        },
        saveAuthorizationCode: function () {}
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model
      });
      const request = new Request({
        body: { client_id: 12345, response_type: 'code' },
        headers: {},
        method: {},
        query: {}
      });

      return handler
        .getClient(request)
        .then(expect.fail)
        .catch(function (e) {
          expect(e)
            .to.be.an.instanceOf(InvalidClientError)
            .and.to.have.a.property(
              'message',
              'Invalid client: missing client `grants`'
            );
        });
    });

    it('throws an error if `client` is unauthorized', function () {
      const model = {
        getAccessToken: function () {},
        getClient: function () {
          return { grants: [] };
        },
        saveAuthorizationCode: function () {}
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model
      });
      const request = new Request({
        body: { client_id: 12345, response_type: 'code' },
        headers: {},
        method: {},
        query: {}
      });

      return handler
        .getClient(request)
        .then(expect.fail)
        .catch(function (e) {
          expect(e)
            .to.be.an.instanceOf(UnauthorizedClientError)
            .and.to.have.a.property(
              'message',
              'Unauthorized client: `grant_type` is invalid'
            );
        });
    });

    it('throws an error if `client.redirectUri` is missing', function () {
      const model = {
        getAccessToken: function () {},
        getClient: function () {
          return { grants: ['authorization_code'] };
        },
        saveAuthorizationCode: function () {}
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model
      });
      const request = new Request({
        body: { client_id: 12345, response_type: 'code' },
        headers: {},
        method: {},
        query: {}
      });

      return handler
        .getClient(request)
        .then(expect.fail)
        .catch(function (e) {
          expect(e)
            .to.be.an.instanceOf(InvalidClientError)
            .and.to.have.a.property(
              'message',
              'Invalid client: missing client `redirectUri`'
            );
        });
    });

    it('throws an error if `client.redirectUri` is not equal to `redirectUri`', function () {
      const model = {
        getAccessToken: function () {},
        getClient: function () {
          return {
            grants: ['authorization_code'],
            redirectUris: ['https://example.com']
          };
        },
        saveAuthorizationCode: function () {}
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model
      });
      const request = new Request({
        body: {
          client_id: 12345,
          response_type: 'code',
          redirect_uri: 'https://foobar.com'
        },
        headers: {},
        method: {},
        query: {}
      });

      return handler
        .getClient(request)
        .then(expect.fail)
        .catch(function (e) {
          expect(e)
            .to.be.an.instanceOf(InvalidClientError)
            .and.to.have.a.property(
              'message',
              'Invalid client: `redirect_uri` does not match client value'
            );
        });
    });

    it('supports promises', function () {
      const model = {
        getAccessToken: function () {},
        getClient: async function () {
          return {
            grants: ['authorization_code'],
            redirectUris: ['http://example.com/cb']
          };
        },
        saveAuthorizationCode: function () {}
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model
      });
      const request = new Request({
        body: { client_id: 12345 },
        headers: {},
        method: {},
        query: {}
      });

      expect(handler.getClient(request)).be.an.instanceOf(Promise);
    });

    it('supports non-promises', function () {
      const model = {
        getAccessToken: function () {},
        getClient: function () {
          return {
            grants: ['authorization_code'],
            redirectUris: ['http://example.com/cb']
          };
        },
        saveAuthorizationCode: function () {}
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model
      });
      const request = new Request({
        body: { client_id: 12345 },
        headers: {},
        method: {},
        query: {}
      });

      expect(handler.getClient(request)).to.be.an.instanceOf(Promise);
    });

    describe('with `client_id` in the request query', function () {
      it('returns a client', function () {
        const client = {
          grants: ['authorization_code'],
          redirectUris: ['http://example.com/cb']
        };
        const model = {
          getAccessToken: function () {},
          getClient: function () {
            return client;
          },
          saveAuthorizationCode: function () {}
        };
        const handler = new AuthorizeHandler({
          authorizationCodeLifetime: 120,
          model
        });
        const request = new Request({
          body: { response_type: 'code' },
          headers: {},
          method: {},
          query: { client_id: 12345 }
        });

        return handler
          .getClient(request)
          .then(function (data) {
            expect(data).to.equal(client);
          })
          .catch(expect.fail);
      });
    });
  });

  describe('getScope()', function () {
    it('throws an error if `scope` is invalid', async function () {
      const model = {
        getAccessToken: function () {},
        getClient: function () {},
        saveAuthorizationCode: function () {}
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model
      });
      const request = new Request({
        body: { scope: 'øå€£‰' },
        headers: {},
        method: {},
        query: {}
      });

      try {
        await handler.getScope(request);

        expect.fail();
      } catch (e) {
        expect(e)
          .to.be.an.instanceOf(InvalidScopeError)
          .and.to.have.a.property('message', 'Invalid parameter: `scope`');
      }
    });

    describe('with `scope` in the request body', function () {
      it('returns the scope', function () {
        const model = {
          getAccessToken: function () {},
          getClient: function () {},
          saveAuthorizationCode: function () {}
        };
        const handler = new AuthorizeHandler({
          authorizationCodeLifetime: 120,
          model
        });
        const request = new Request({
          body: { scope: 'foo' },
          headers: {},
          method: {},
          query: {}
        });

        expect(handler.getScope(request)).to.eql(['foo']);
      });
    });

    describe('with `scope` in the request query', function () {
      it('returns the scope', function () {
        const model = {
          getAccessToken: function () {},
          getClient: function () {},
          saveAuthorizationCode: function () {}
        };
        const handler = new AuthorizeHandler({
          authorizationCodeLifetime: 120,
          model
        });
        const request = new Request({
          body: {},
          headers: {},
          method: {},
          query: { scope: 'foo' }
        });

        expect(handler.getScope(request)).to.eql(['foo']);
      });
    });
  });

  describe('getState()', function () {
    it('throws an error if `allowEmptyState` is false and `state` is missing', async function () {
      const model = {
        getAccessToken: function () {},
        getClient: function () {},
        saveAuthorizationCode: function () {}
      };
      const handler = new AuthorizeHandler({
        allowEmptyState: false,
        authorizationCodeLifetime: 120,
        model
      });
      const request = new Request({
        body: {},
        headers: {},
        method: {},
        query: {}
      });

      try {
        await handler.getState(request);

        expect.fail();
      } catch (e) {
        expect(e)
          .to.be.an.instanceOf(InvalidRequestError)
          .and.to.have.a.property('message', 'Missing parameter: `state`');
      }
    });

    it('allows missing `state` if `allowEmptyState` is valid', function () {
      const model = {
        getAccessToken: function () {},
        getClient: function () {},
        saveAuthorizationCode: function () {}
      };
      const handler = new AuthorizeHandler({
        allowEmptyState: true,
        authorizationCodeLifetime: 120,
        model
      });
      const request = new Request({
        body: {},
        headers: {},
        method: {},
        query: {}
      });

      expect(handler.getState(request)).to.be.undefined;
    });

    it('throws an error if `state` is invalid', async function () {
      const model = {
        getAccessToken: function () {},
        getClient: function () {},
        saveAuthorizationCode: function () {}
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model
      });
      const request = new Request({
        body: {},
        headers: {},
        method: {},
        query: { state: 'øå€£‰' }
      });

      try {
        await handler.getState(request);

        expect.fail();
      } catch (e) {
        expect(e)
          .to.be.an.instanceOf(InvalidRequestError)
          .and.to.have.a.property('message', 'Invalid parameter: `state`');
      }
    });

    describe('with `state` in the request body', function () {
      it('returns the state', function () {
        const model = {
          getAccessToken: function () {},
          getClient: function () {},
          saveAuthorizationCode: function () {}
        };
        const handler = new AuthorizeHandler({
          authorizationCodeLifetime: 120,
          model
        });
        const request = new Request({
          body: { state: 'foobar' },
          headers: {},
          method: {},
          query: {}
        });

        expect(handler.getState(request)).to.equal('foobar');
      });
    });

    describe('with `state` in the request query', function () {
      it('returns the state', function () {
        const model = {
          getAccessToken: function () {},
          getClient: function () {},
          saveAuthorizationCode: function () {}
        };
        const handler = new AuthorizeHandler({
          authorizationCodeLifetime: 120,
          model
        });
        const request = new Request({
          body: {},
          headers: {},
          method: {},
          query: { state: 'foobar' }
        });

        expect(handler.getState(request)).to.equal('foobar');
      });
    });
  });

  describe('getUser()', function () {
    it('throws an error if `user` is missing', function () {
      const authenticateHandler = { handle: function () {} };
      const model = {
        getClient: function () {},
        saveAuthorizationCode: function () {}
      };
      const handler = new AuthorizeHandler({
        authenticateHandler: authenticateHandler,
        authorizationCodeLifetime: 120,
        model
      });
      const request = new Request({
        body: {},
        headers: {},
        method: {},
        query: {}
      });
      const response = new Response();

      return handler
        .getUser(request, response)
        .then(expect.fail)
        .catch(function (e) {
          expect(e)
            .to.be.an.instanceOf(ServerError)
            .and.to.have.a.property(
              'message',
              'Server error: `handle()` did not return a `user` object'
            );
        });
    });

    it('returns a user', function () {
      const user = {};
      const model = {
        getAccessToken: function () {
          return {
            user: user,
            accessTokenExpiresAt: new Date(new Date().getTime() + 10000)
          };
        },
        getClient: function () {},
        saveAuthorizationCode: function () {}
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model
      });
      const request = new Request({
        body: {},
        headers: { Authorization: 'Bearer foo' },
        method: {},
        query: {}
      });
      const response = new Response({ body: {}, headers: {} });

      return handler
        .getUser(request, response)
        .then(function (data) {
          expect(data).to.equal(user);
        })
        .catch(expect.fail);
    });
  });

  describe('saveAuthorizationCode()', function () {
    it('returns an auth code', function () {
      const authorizationCode = {};
      const model = {
        getAccessToken: function () {},
        getClient: function () {},
        saveAuthorizationCode: function () {
          return authorizationCode;
        }
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model
      });

      return handler
        .saveAuthorizationCode('foo', 'bar', 'biz', 'baz')
        .then(function (data) {
          expect(data).to.equal(authorizationCode);
        })
        .catch(expect.fail);
    });

    it('supports promises when calling `model.saveAuthorizationCode()`', function () {
      const model = {
        getAccessToken: function () {},
        getClient: function () {},
        saveAuthorizationCode: async function () {
          return {};
        }
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model
      });

      expect(
        handler.saveAuthorizationCode('foo', 'bar', 'biz', 'baz')
      ).to.be.an.instanceOf(Promise);
    });

    it('supports non-promises when calling `model.saveAuthorizationCode()`', function () {
      const model = {
        getAccessToken: function () {},
        getClient: function () {},
        saveAuthorizationCode: function () {
          return {};
        }
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model
      });

      expect(
        handler.saveAuthorizationCode('foo', 'bar', 'biz', 'baz')
      ).to.be.an.instanceOf(Promise);
    });
  });

  describe('getResponseType()', function () {
    it('throws an error if `response_type` is missing', async function () {
      const model = {
        getAccessToken: function () {},
        getClient: function () {},
        saveAuthorizationCode: function () {}
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model
      });
      const request = new Request({
        body: {},
        headers: {},
        method: {},
        query: {}
      });

      try {
        await handler.getResponseType(request);

        expect.fail();
      } catch (e) {
        expect(e)
          .to.be.an.instanceOf(InvalidRequestError)
          .and.to.have.a.property(
            'message',
            'Missing parameter: `response_type`'
          );
      }
    });

    it('throws an error if `response_type` is not `code`', async function () {
      const model = {
        getAccessToken: function () {},
        getClient: function () {},
        saveAuthorizationCode: function () {}
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model
      });
      const request = new Request({
        body: { response_type: 'foobar' },
        headers: {},
        method: {},
        query: {}
      });

      try {
        await handler.getResponseType(request);

        expect.fail();
      } catch (e) {
        expect(e)
          .to.be.an.instanceOf(UnsupportedResponseTypeError)
          .and.to.have.a.property(
            'message',
            'Unsupported response type: `response_type` is not supported'
          );
      }
    });

    describe('with `response_type` in the request body', function () {
      it('return a response type', function () {
        const model = {
          getAccessToken: function () {},
          getClient: function () {},
          saveAuthorizationCode: function () {}
        };
        const handler = new AuthorizeHandler({
          authorizationCodeLifetime: 120,
          model
        });
        const request = new Request({
          body: { response_type: 'code' },
          headers: {},
          method: {},
          query: {}
        });
        const ResponseType = handler.getResponseType(request);

        expect(ResponseType).to.equal(CodeResponseType);
      });
    });

    describe('with `response_type` in the request query', function () {
      it('returns a response type', function () {
        const model = {
          getAccessToken: function () {},
          getClient: function () {},
          saveAuthorizationCode: function () {}
        };
        const handler = new AuthorizeHandler({
          authorizationCodeLifetime: 120,
          model
        });
        const request = new Request({
          body: {},
          headers: {},
          method: {},
          query: { response_type: 'code' }
        });
        const ResponseType = handler.getResponseType(request);

        expect(ResponseType).to.equal(CodeResponseType);
      });
    });
  });

  describe('buildSuccessRedirectUri()', function () {
    it('returns a redirect uri', function () {
      const model = {
        getAccessToken: function () {},
        getClient: function () {},
        saveAuthorizationCode: function () {}
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model
      });
      const responseType = new CodeResponseType(12345);
      const redirectUri = handler.buildSuccessRedirectUri(
        'http://example.com/cb',
        responseType
      );

      expect(url.format(redirectUri)).to.equal(
        'http://example.com/cb?code=12345'
      );
    });
  });

  describe('buildErrorRedirectUri()', function () {
    it('sets `error_description` if available', function () {
      const error = new InvalidClientError('foo bar');
      const model = {
        getAccessToken: function () {},
        getClient: function () {},
        saveAuthorizationCode: function () {}
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model
      });
      const redirectUri = handler.buildErrorRedirectUri(
        'http://example.com/cb',
        error
      );

      expect(url.format(redirectUri)).to.equal(
        'http://example.com/cb?error=invalid_client&error_description=foo%20bar'
      );
    });

    it('returns a redirect uri', function () {
      const error = new InvalidClientError();
      const model = {
        getAccessToken: function () {},
        getClient: function () {},
        saveAuthorizationCode: function () {}
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model
      });
      const redirectUri = handler.buildErrorRedirectUri(
        'http://example.com/cb',
        error
      );

      expect(url.format(redirectUri)).to.equal(
        'http://example.com/cb?error=invalid_client&error_description=Bad%20Request'
      );
    });
  });

  describe('updateResponse()', function () {
    it('sets the `location` header', function () {
      const model = {
        getAccessToken: function () {},
        getClient: function () {},
        saveAuthorizationCode: function () {}
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model
      });
      const response = new Response({ body: {}, headers: {} });
      const uri = url.parse('http://example.com/cb');

      handler.updateResponse(response, uri, 'foobar');

      expect(response.get('location')).to.equal(
        'http://example.com/cb?state=foobar'
      );
    });
  });

  describe('getCodeChallengeMethod()', function () {
    it('gets code challenge method', function () {
      const model = {
        getAccessToken: function () {},
        getClient: function () {},
        saveAuthorizationCode: function () {}
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model
      });
      const request = new Request({
        body: { code_challenge_method: 'S256' },
        headers: {},
        method: {},
        query: {}
      });

      const codeChallengeMethod = handler.getCodeChallengeMethod(request);
      expect(codeChallengeMethod).to.equal('S256');
    });

    it('throws if the code challenge method is not supported', async function () {
      const model = {
        getAccessToken: function () {},
        getClient: function () {},
        saveAuthorizationCode: function () {}
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model
      });
      const request = new Request({
        body: { code_challenge_method: 'foo' },
        headers: {},
        method: {},
        query: {}
      });

      try {
        await handler.getCodeChallengeMethod(request);

        expect.fail();
      } catch (e) {
        // defined in RFC 7636 - 4.4
        expect(e)
          .to.be.an.instanceOf(InvalidRequestError)
          .and.to.have.a.property(
            'message',
            // prettier-ignore
            'Invalid request: transform algorithm \'foo\' not supported'
          );
      }
    });

    it('gets default code challenge method plain if missing', function () {
      const model = {
        getAccessToken: function () {},
        getClient: function () {},
        saveAuthorizationCode: function () {}
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model
      });
      const request = new Request({
        body: {},
        headers: {},
        method: {},
        query: {}
      });

      const codeChallengeMethod = handler.getCodeChallengeMethod(request);
      expect(codeChallengeMethod).to.equal('plain');
    });
  });

  describe('getCodeChallenge()', function () {
    it('gets code challenge', function () {
      const model = {
        getAccessToken: function () {},
        getClient: function () {},
        saveAuthorizationCode: function () {}
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model
      });
      const request = new Request({
        body: { code_challenge: 'challenge' },
        headers: {},
        method: {},
        query: {}
      });

      const codeChallengeMethod = handler.getCodeChallenge(request);
      expect(codeChallengeMethod).to.equal('challenge');
    });
  });
});
