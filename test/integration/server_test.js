'use strict';

/**
 * Module dependencies.
 */

import InvalidArgumentError from '../../lib/errors/invalid-argument-error.js';
import Request from '../../lib/request.js';
import Response from '../../lib/response.js';
import Server from '../../lib/server.js';
import { describe, expect, it } from '../test-utils.js';

/**
 * Test `Server` integration.
 */

describe('Server integration', function () {
  describe('constructor()', function () {
    it('throws an error if `model` is missing', function () {
      [null, undefined, {}].forEach((options) => {
        try {
          new Server(options);

          expect.fail();
        } catch (e) {
          expect(e).to.be.an.instanceOf(InvalidArgumentError);
          expect(e.message).to.equal('Missing parameter: `model`');
        }
      });
    });

    it('sets the `model`', function () {
      const model = {};
      const server = new Server({ model: model });

      expect(server.options.model).to.equal(model);
    });
  });

  describe('authenticate()', function () {
    it('sets the default `options`', async function () {
      const model = {
        getAccessToken: function () {
          return {
            user: {},
            accessTokenExpiresAt: new Date(new Date().getTime() + 10000)
          };
        }
      };
      const server = new Server({ model: model });
      const request = new Request({
        body: {},
        headers: { Authorization: 'Bearer foo' },
        method: {},
        query: {}
      });
      const response = new Response({ body: {}, headers: {} });

      try {
        await server.authenticate(request, response);
      } catch (e) {
        expect(server.addAcceptedScopesHeader).to.be.true;
        expect(server.addAuthorizedScopesHeader).to.be.true;
        expect(server.allowBearerTokensInQueryString).to.be.false;
        expect.fail();
      }
    });

    it('returns a promise', function () {
      const model = {
        getAccessToken: async function (token) {
          return {
            user: {},
            accessTokenExpiresAt: new Date(new Date().getTime() + 10000)
          };
        }
      };
      const server = new Server({ model: model });
      const request = new Request({
        body: {},
        headers: { Authorization: 'Bearer foo' },
        method: {},
        query: {}
      });
      const response = new Response({ body: {}, headers: {} });
      const handler = server.authenticate(request, response);

      expect(handler).to.be.an.instanceOf(Promise);
    });
  });

  describe('authorize()', function () {
    it('sets the default `options`', async function () {
      const model = {
        getAccessToken: function () {
          return {
            user: {},
            accessTokenExpiresAt: new Date(new Date().getTime() + 10000)
          };
        },
        getClient: function () {
          return {
            grants: ['authorization_code'],
            redirectUris: ['http://example.com/cb']
          };
        },
        saveAuthorizationCode: function () {
          return { authorizationCode: 123 };
        }
      };
      const server = new Server({ model: model });
      const request = new Request({
        body: {
          client_id: 1234,
          client_secret: 'secret',
          response_type: 'code'
        },
        headers: { Authorization: 'Bearer foo' },
        method: {},
        query: { state: 'foobar' }
      });
      const response = new Response({ body: {}, headers: {} });

      try {
        await server.authorize(request, response);
      } catch (e) {
        expect(server.allowEmptyState).to.be.false;
        expect(server.authorizationCodeLifetime).to.equal(300);
        expect.fail();
      }
    });

    it('returns a promise', function () {
      const model = {
        getAccessToken: function () {
          return {
            user: {},
            accessTokenExpiresAt: new Date(new Date().getTime() + 10000)
          };
        },
        getClient: function () {
          return {
            grants: ['authorization_code'],
            redirectUris: ['http://example.com/cb']
          };
        },
        saveAuthorizationCode: function () {
          return { authorizationCode: 123 };
        }
      };
      const server = new Server({ model: model });
      const request = new Request({
        body: {
          client_id: 1234,
          client_secret: 'secret',
          response_type: 'code'
        },
        headers: { Authorization: 'Bearer foo' },
        method: {},
        query: { state: 'foobar' }
      });
      const response = new Response({ body: {}, headers: {} });
      const handler = server.authorize(request, response);

      expect(handler).to.be.an.instanceOf(Promise);
    });
  });

  describe('token()', function () {
    it('sets the default `options`', async function () {
      const model = {
        getClient: function () {
          return { grants: ['password'] };
        },
        getUser: function () {
          return {};
        },
        saveToken: function () {
          return { accessToken: 1234, client: {}, user: {} };
        },
        validateScope: function () {
          return ['foo'];
        }
      };
      const server = new Server({ model: model });
      const request = new Request({
        body: {
          client_id: 1234,
          client_secret: 'secret',
          grant_type: 'password',
          username: 'foo',
          password: 'pass',
          scope: 'foo'
        },
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'transfer-encoding': 'chunked'
        },
        method: 'POST',
        query: {}
      });
      const response = new Response({ body: {}, headers: {} });

      try {
        await server.token(request, response);
      } catch (e) {
        expect(server.accessTokenLifetime).to.equal(3600);
        expect(server.refreshTokenLifetime).to.equal(1209600);
        expect.fail();
      }
    });

    it('returns a promise', function () {
      const model = {
        getClient: function () {
          return { grants: ['password'] };
        },
        getUser: function () {
          return {};
        },
        saveToken: function () {
          return { accessToken: 1234, client: {}, user: {} };
        }
      };
      const server = new Server({ model: model });
      const request = new Request({
        body: {
          client_id: 1234,
          client_secret: 'secret',
          grant_type: 'password',
          username: 'foo',
          password: 'pass'
        },
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'transfer-encoding': 'chunked'
        },
        method: 'POST',
        query: {}
      });
      const response = new Response({ body: {}, headers: {} });
      const handler = server.token(request, response);

      expect(handler).to.be.an.instanceOf(Promise);
    });
  });
});
