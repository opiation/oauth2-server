'use strict';

/**
 * Module dependencies.
 */

import crypto from 'node:crypto';
import util from 'node:util';
import AccessDeniedError from '../../../lib/errors/access-denied-error.js';
import BearerTokenType from '../../../lib/token-types/bearer-token-type.js';
import InvalidArgumentError from '../../../lib/errors/invalid-argument-error.js';
import InvalidClientError from '../../../lib/errors/invalid-client-error.js';
import InvalidGrantError from '../../../lib/errors/invalid-grant-error.js';
import InvalidRequestError from '../../../lib/errors/invalid-request-error.js';
import PasswordGrantType from '../../../lib/grant-types/password-grant-type.js';
import Request from '../../../lib/request.js';
import Response from '../../../lib/response.js';
import ServerError from '../../../lib/errors/server-error.js';
import TokenHandler from '../../../lib/handlers/token-handler.js';
import UnauthorizedClientError from '../../../lib/errors/unauthorized-client-error.js';
import UnsupportedGrantTypeError from '../../../lib/errors/unsupported-grant-type-error.js';
import { base64URLEncode } from '../../../lib/utils/string-util.js';
import { describe, expect, it } from '../../test-utils.js';

/**
 * Test `TokenHandler` integration.
 */

describe('TokenHandler integration', function () {
  describe('constructor()', function () {
    it('throws an error if `options.accessTokenLifetime` is missing', function () {
      try {
        new TokenHandler();

        expect.fail();
      } catch (e) {
        expect(e)
          .to.be.an.instanceOf(InvalidArgumentError)
          .and.to.have.property(
            'message',
            'Missing parameter: `accessTokenLifetime`'
          );
      }
    });

    it('throws an error if `options.model` is missing', function () {
      try {
        new TokenHandler({ accessTokenLifetime: 120 });

        expect.fail();
      } catch (e) {
        expect(e)
          .to.be.an.instanceOf(InvalidArgumentError)
          .and.to.have.property('message', 'Missing parameter: `model`');
      }
    });

    it('throws an error if `options.refreshTokenLifetime` is missing', function () {
      try {
        new TokenHandler({ accessTokenLifetime: 120, model: {} });

        expect.fail();
      } catch (e) {
        expect(e)
          .to.be.an.instanceOf(InvalidArgumentError)
          .and.to.have.property(
            'message',
            'Missing parameter: `refreshTokenLifetime`'
          );
      }
    });

    it('throws an error if the model does not implement `getClient()`', function () {
      try {
        new TokenHandler({
          accessTokenLifetime: 120,
          model: {},
          refreshTokenLifetime: 120
        });

        expect.fail();
      } catch (e) {
        expect(e)
          .to.be.an.instanceOf(InvalidArgumentError)
          .and.to.have.property(
            'message',
            'Invalid argument: model does not implement `getClient()`'
          );
      }
    });

    it('sets the `accessTokenLifetime`', function () {
      const accessTokenLifetime = {};
      const model = {
        getClient: function () {},
        saveToken: function () {}
      };
      const handler = new TokenHandler({
        accessTokenLifetime: accessTokenLifetime,
        model: model,
        refreshTokenLifetime: 120
      });

      expect(handler.accessTokenLifetime).to.equal(accessTokenLifetime);
    });

    it('sets the `alwaysIssueNewRefreshToken`', function () {
      const alwaysIssueNewRefreshToken = true;
      const model = {
        getClient: function () {},
        saveToken: function () {}
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 123,
        model: model,
        refreshTokenLifetime: 120,
        alwaysIssueNewRefreshToken: alwaysIssueNewRefreshToken
      });

      expect(handler.alwaysIssueNewRefreshToken).to.equal(
        alwaysIssueNewRefreshToken
      );
    });

    it('sets the `alwaysIssueNewRefreshToken` to false', function () {
      const alwaysIssueNewRefreshToken = false;
      const model = {
        getClient: function () {},
        saveToken: function () {}
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 123,
        model: model,
        refreshTokenLifetime: 120,
        alwaysIssueNewRefreshToken: alwaysIssueNewRefreshToken
      });

      expect(handler.alwaysIssueNewRefreshToken).to.equal(
        alwaysIssueNewRefreshToken
      );
    });

    it('returns the default `alwaysIssueNewRefreshToken` value', function () {
      const model = {
        getClient: function () {},
        saveToken: function () {}
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 123,
        model: model,
        refreshTokenLifetime: 120
      });

      expect(handler.alwaysIssueNewRefreshToken).to.equal(true);
    });

    it('sets the `extendedGrantTypes`', function () {
      const extendedGrantTypes = { foo: 'bar' };
      const model = {
        getClient: function () {},
        saveToken: function () {}
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        extendedGrantTypes: extendedGrantTypes,
        model: model,
        refreshTokenLifetime: 120
      });

      expect(handler.grantTypes).to.deep.include(extendedGrantTypes);
    });

    it('sets the `model`', function () {
      const model = {
        getClient: function () {},
        saveToken: function () {}
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120
      });

      expect(handler.model).to.equal(model);
    });

    it('sets the `refreshTokenLifetime`', function () {
      const refreshTokenLifetime = {};
      const model = {
        getClient: function () {},
        saveToken: function () {}
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: refreshTokenLifetime
      });

      expect(handler.refreshTokenLifetime).to.equal(refreshTokenLifetime);
    });
  });

  describe('handle()', function () {
    it('throws an error if `request` is missing', async function () {
      const model = {
        getClient: function () {},
        saveToken: function () {}
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120
      });

      try {
        await handler.handle();

        expect.fail();
      } catch (e) {
        expect(e)
          .to.be.an.instanceOf(InvalidArgumentError)
          .and.to.have.property(
            'message',
            'Invalid argument: `request` must be an instance of Request'
          );
      }
    });

    it('throws an error if `response` is missing', async function () {
      const model = {
        getClient: function () {},
        saveToken: function () {}
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120
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
          .and.to.have.property(
            'message',
            'Invalid argument: `response` must be an instance of Response'
          );
      }
    });

    it('throws an error if the method is not `POST`', function () {
      const model = {
        getClient: function () {},
        saveToken: function () {}
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120
      });
      const request = new Request({
        body: {},
        headers: {},
        method: 'GET',
        query: {}
      });
      const response = new Response({ body: {}, headers: {} });

      return handler
        .handle(request, response)
        .then(expect.fail)
        .catch(function (e) {
          expect(e)
            .to.be.an.instanceOf(InvalidRequestError)
            .and.to.have.property(
              'message',
              'Invalid request: method must be POST'
            );
        });
    });

    it('throws an error if the media type is not `application/x-www-form-urlencoded`', function () {
      const model = {
        getClient: function () {},
        saveToken: function () {}
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120
      });
      const request = new Request({
        body: {},
        headers: {},
        method: 'POST',
        query: {}
      });
      const response = new Response({ body: {}, headers: {} });

      return handler
        .handle(request, response)
        .then(expect.fail)
        .catch(function (e) {
          expect(e)
            .to.be.an.instanceOf(InvalidRequestError)
            .and.to.have.property(
              'message',
              'Invalid request: content must be application/x-www-form-urlencoded'
            );
        });
    });

    it('throws the error if an oauth error is thrown', function () {
      const model = {
        getClient: function () {},
        saveToken: function () {}
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120
      });
      const request = new Request({
        body: {},
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'transfer-encoding': 'chunked'
        },
        method: 'POST',
        query: {}
      });
      const response = new Response({ body: {}, headers: {} });

      return handler
        .handle(request, response)
        .then(expect.fail)
        .catch(function (e) {
          expect(e)
            .to.be.an.instanceOf(InvalidClientError)
            .and.to.have.property(
              'message',
              'Invalid client: cannot retrieve client credentials'
            );
        });
    });

    it('throws a server error if a non-oauth error is thrown', function () {
      const model = {
        getClient: function () {
          throw new Error('Unhandled exception');
        },
        getUser: function () {},
        saveToken: function () {}
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120
      });
      const request = new Request({
        body: {
          client_id: 12345,
          client_secret: 'secret',
          grant_type: 'password',
          password: 'bar',
          username: 'foo'
        },
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'transfer-encoding': 'chunked'
        },
        method: 'POST',
        query: {}
      });
      const response = new Response({ body: {}, headers: {} });

      return handler
        .handle(request, response)
        .then(expect.fail)
        .catch(function (e) {
          expect(e).to.be.an.instanceOf(ServerError);
          expect(e.inner).to.be.an.instanceOf(Error);
          expect(e.message).to.equal('Unhandled exception');
        });
    });

    it('updates the response if an error is thrown', function () {
      const model = {
        getClient: function () {
          throw new Error('Unhandled exception');
        },
        getUser: function () {},
        saveToken: function () {}
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120
      });
      const request = new Request({
        body: {
          client_id: 12345,
          client_secret: 'secret',
          grant_type: 'password',
          password: 'bar',
          username: 'foo'
        },
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'transfer-encoding': 'chunked'
        },
        method: 'POST',
        query: {}
      });
      const response = new Response({ body: {}, headers: {} });

      return handler
        .handle(request, response)
        .then(expect.fail)
        .catch(function () {
          expect(response.body).to.eql({
            error: 'server_error',
            error_description: 'Unhandled exception'
          });
          expect(response.status).to.equal(503);
        });
    });

    it('returns a bearer token if successful', function () {
      const token = {
        accessToken: 'foo',
        client: {},
        refreshToken: 'bar',
        scope: ['foobar'],
        user: {}
      };
      const model = {
        getClient: function () {
          return { grants: ['password'] };
        },
        getUser: function () {
          return {};
        },
        saveToken: function () {
          return token;
        },
        validateScope: function () {
          return ['baz'];
        }
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120
      });
      const request = new Request({
        body: {
          client_id: 12345,
          client_secret: 'secret',
          username: 'foo',
          password: 'bar',
          grant_type: 'password',
          scope: 'baz'
        },
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'transfer-encoding': 'chunked'
        },
        method: 'POST',
        query: {}
      });
      const response = new Response({ body: {}, headers: {} });

      return handler
        .handle(request, response)
        .then(function (data) {
          expect(data).to.eql(token);
        })
        .catch(expect.fail);
    });

    it('does not return custom attributes in a bearer token if the allowExtendedTokenAttributes is not set', function () {
      const token = {
        accessToken: 'foo',
        client: {},
        refreshToken: 'bar',
        scope: ['baz'],
        user: {},
        foo: 'bar'
      };
      const model = {
        getClient: function () {
          return { grants: ['password'] };
        },
        getUser: function () {
          return {};
        },
        saveToken: function () {
          return token;
        },
        validateScope: function () {
          return ['baz'];
        }
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120
      });
      const request = new Request({
        body: {
          client_id: 12345,
          client_secret: 'secret',
          username: 'foo',
          password: 'bar',
          grant_type: 'password',
          scope: 'baz'
        },
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'transfer-encoding': 'chunked'
        },
        method: 'POST',
        query: {}
      });
      const response = new Response({ body: {}, headers: {} });

      return handler
        .handle(request, response)
        .then(function () {
          expect(response.body.access_token).to.exist;
          expect(response.body.foo).to.not.exist;
          expect(response.body.refresh_token).to.exist;
          expect(response.body.scope).to.eql('baz');
          expect(response.body.token_type).to.exist;
        })
        .catch(expect.fail);
    });

    it('returns custom attributes in a bearer token if the allowExtendedTokenAttributes is set', function () {
      const token = {
        accessToken: 'foo',
        client: {},
        refreshToken: 'bar',
        scope: ['baz'],
        user: {},
        foo: 'bar'
      };
      const model = {
        getClient: function () {
          return { grants: ['password'] };
        },
        getUser: function () {
          return {};
        },
        saveToken: function () {
          return token;
        },
        validateScope: function () {
          return ['baz'];
        }
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120,
        allowExtendedTokenAttributes: true
      });
      const request = new Request({
        body: {
          client_id: 12345,
          client_secret: 'secret',
          username: 'foo',
          password: 'bar',
          grant_type: 'password',
          scope: 'baz'
        },
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'transfer-encoding': 'chunked'
        },
        method: 'POST',
        query: {}
      });
      const response = new Response({ body: {}, headers: {} });

      return handler
        .handle(request, response)
        .then(function () {
          expect(response.body.access_token).to.exist;
          expect(response.body.refresh_token).to.exist;
          expect(response.body.token_type).to.exist;
          expect(response.body.scope).to.eql('baz');
          expect(response.body.foo).to.exist;
        })
        .catch(expect.fail);
    });
  });

  describe('getClient()', function () {
    it('throws an error if `clientId` is invalid', async function () {
      const model = {
        getClient: function () {},
        saveToken: function () {}
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120
      });
      const request = new Request({
        body: { client_id: 'øå€£‰', client_secret: 'foo' },
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
          .and.to.have.property('message', 'Invalid parameter: `client_id`');
      }
    });

    it('throws an error if `clientSecret` is invalid', async function () {
      const model = {
        getClient: function () {},
        saveToken: function () {}
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120
      });
      const request = new Request({
        body: { client_id: 'foo', client_secret: 'øå€£‰' },
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
          .and.to.have.property(
            'message',
            'Invalid parameter: `client_secret`'
          );
      }
    });

    it('throws an error if `client` is missing', function () {
      const model = {
        getClient: function () {},
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
        .then(expect.fail)
        .catch(function (e) {
          expect(e)
            .to.be.an.instanceOf(InvalidClientError)
            .and.to.have.property(
              'message',
              'Invalid client: client is invalid'
            );
        });
    });

    it('throws an error if `client.grants` is missing', function () {
      const model = {
        getClient: function () {
          return {};
        },
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
        .then(expect.fail)
        .catch(function (e) {
          expect(e)
            .to.be.an.instanceOf(ServerError)
            .and.to.have.property(
              'message',
              'Server error: missing client `grants`'
            );
        });
    });

    it('throws an error if `client.grants` is invalid', function () {
      const model = {
        getClient: function () {
          return { grants: 'foobar' };
        },
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
        .then(expect.fail)
        .catch(function (e) {
          expect(e)
            .to.be.an.instanceOf(ServerError)
            .and.to.have.property(
              'message',
              'Server error: `grants` must be an array'
            );
        });
    });

    it('throws a 401 error if the client is invalid and the request contains an authorization header', function () {
      const model = {
        getClient: function () {},
        saveToken: function () {}
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120
      });
      const request = new Request({
        body: {},
        headers: {
          authorization: util.format(
            'Basic %s',
            Buffer.from('foo:bar').toString('base64')
          )
        },
        method: {},
        query: {}
      });
      const response = new Response({ body: {}, headers: {} });

      return handler
        .getClient(request, response)
        .then(expect.fail)
        .catch(function (e) {
          expect(e).to.be.an.instanceOf(InvalidClientError);
          expect(e.code).to.equal(401);
          expect(e.message).to.equal('Invalid client: client is invalid');
          expect(response.get('WWW-Authenticate')).to.equal(
            'Basic realm="Service"'
          );
        });
    });

    it('returns a client', function () {
      const client = { id: 12345, grants: [] };
      const model = {
        getClient: function () {
          return client;
        },
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
        .then(function (data) {
          expect(data).to.equal(client);
        })
        .catch(expect.fail);
    });

    describe('with `password` grant type and `requireClientAuthentication` is false', function () {
      it('returns a client ', function () {
        const client = { id: 12345, grants: [] };
        const model = {
          getClient: function () {
            return client;
          },
          saveToken: function () {}
        };

        const handler = new TokenHandler({
          accessTokenLifetime: 120,
          model: model,
          refreshTokenLifetime: 120,
          requireClientAuthentication: {
            password: false
          }
        });
        const request = new Request({
          body: { client_id: 'blah', grant_type: 'password' },
          headers: {},
          method: {},
          query: {}
        });

        return handler
          .getClient(request)
          .then(function (data) {
            expect(data).to.equal(client);
          })
          .catch(expect.fail);
      });
    });

    describe('with `password` grant type and `requireClientAuthentication` is false and Authorization header', function () {
      it('returns a client ', function () {
        const client = { id: 12345, grants: [] };
        const model = {
          getClient: function () {
            return client;
          },
          saveToken: function () {}
        };

        const handler = new TokenHandler({
          accessTokenLifetime: 120,
          model: model,
          refreshTokenLifetime: 120,
          requireClientAuthentication: {
            password: false
          }
        });
        const request = new Request({
          body: { grant_type: 'password' },
          headers: {
            authorization: util.format(
              'Basic %s',
              Buffer.from('blah:').toString('base64')
            )
          },
          method: {},
          query: {}
        });

        return handler
          .getClient(request)
          .then(function (data) {
            expect(data).equal(client);
          })
          .catch(expect.fail);
      });
    });

    it('supports promises', function () {
      const model = {
        getClient: async function () {
          return { grants: [] };
        },
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

      expect(handler.getClient(request)).to.be.an.instanceOf(Promise);
    });

    it('supports non-promises', function () {
      const model = {
        getClient: function () {
          return { grants: [] };
        },
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

      expect(handler.getClient(request)).to.be.an.instanceOf(Promise);
    });
  });

  describe('getClientCredentials()', function () {
    it('throws an error if `client_id` is missing', async function () {
      const model = {
        getClient: function () {},
        saveToken: function () {}
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120
      });
      const request = new Request({
        body: { client_secret: 'foo' },
        headers: {},
        method: {},
        query: {}
      });

      try {
        await handler.getClientCredentials(request);

        expect.fail();
      } catch (e) {
        expect(e)
          .to.be.an.instanceOf(InvalidClientError)
          .and.to.have.a.property(
            'message',
            'Invalid client: cannot retrieve client credentials'
          );
      }
    });

    it('throws an error if `client_secret` is missing', async function () {
      const model = {
        getClient: function () {},
        saveToken: function () {}
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120
      });
      const request = new Request({
        body: { client_id: 'foo' },
        headers: {},
        method: {},
        query: {}
      });

      try {
        await handler.getClientCredentials(request);

        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceOf(InvalidClientError);
        expect(e).to.have.property(
          'message',
          'Invalid client: cannot retrieve client credentials'
        );
      }
    });

    describe('with `client_id` and grant type is `password` and `requireClientAuthentication` is false', function () {
      it('returns a client', function () {
        const model = {
          getClient: function () {},
          saveToken: function () {}
        };
        const handler = new TokenHandler({
          accessTokenLifetime: 120,
          model: model,
          refreshTokenLifetime: 120,
          requireClientAuthentication: { password: false }
        });
        const request = new Request({
          body: { client_id: 'foo', grant_type: 'password' },
          headers: {},
          method: {},
          query: {}
        });
        const credentials = handler.getClientCredentials(request);

        expect(credentials).to.eql({ clientId: 'foo' });
      });
    });

    describe('with `client_id` and `client_secret` in the request header as basic auth', function () {
      it('returns a client', function () {
        const model = {
          getClient: function () {},
          saveToken: function () {}
        };
        const handler = new TokenHandler({
          accessTokenLifetime: 120,
          model: model,
          refreshTokenLifetime: 120
        });
        const request = new Request({
          body: {},
          headers: {
            authorization: util.format(
              'Basic %s',
              Buffer.from('foo:bar').toString('base64')
            )
          },
          method: {},
          query: {}
        });
        const credentials = handler.getClientCredentials(request);

        expect(credentials).to.eql({ clientId: 'foo', clientSecret: 'bar' });
      });
    });

    describe('with `client_id` and `client_secret` in the request body', function () {
      it('returns a client', function () {
        const model = {
          getClient: function () {},
          saveToken: function () {}
        };
        const handler = new TokenHandler({
          accessTokenLifetime: 120,
          model: model,
          refreshTokenLifetime: 120
        });
        const request = new Request({
          body: { client_id: 'foo', client_secret: 'bar' },
          headers: {},
          method: {},
          query: {}
        });
        const credentials = handler.getClientCredentials(request);

        expect(credentials).to.eql({ clientId: 'foo', clientSecret: 'bar' });
      });
    });
  });

  describe('handleGrantType()', function () {
    it('throws an error if `grant_type` is missing', async function () {
      const model = {
        getClient: function () {},
        saveToken: function () {}
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120
      });
      const request = new Request({
        body: {},
        headers: {},
        method: {},
        query: {}
      });

      try {
        await handler.handleGrantType(request);

        expect.fail();
      } catch (e) {
        expect(e)
          .to.be.an.instanceOf(InvalidRequestError)
          .and.to.have.property('message', 'Missing parameter: `grant_type`');
      }
    });

    it('throws an error if `grant_type` is invalid', async function () {
      const model = {
        getClient: function () {},
        saveToken: function () {}
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120
      });
      const request = new Request({
        body: { grant_type: '~foo~' },
        headers: {},
        method: {},
        query: {}
      });

      try {
        await handler.handleGrantType(request);

        expect.fail();
      } catch (e) {
        expect(e)
          .to.be.an.instanceOf(InvalidRequestError)
          .and.to.have.property('message', 'Invalid parameter: `grant_type`');
      }
    });

    it('throws an error if `grant_type` is unsupported', async function () {
      const model = {
        getClient: function () {},
        saveToken: function () {}
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120
      });
      const request = new Request({
        body: { grant_type: 'foobar' },
        headers: {},
        method: {},
        query: {}
      });

      try {
        await handler.handleGrantType(request);

        expect.fail();
      } catch (e) {
        expect(e)
          .to.be.an.instanceOf(UnsupportedGrantTypeError)
          .and.to.have.property(
            'message',
            'Unsupported grant type: `grant_type` is invalid'
          );
      }
    });

    it('throws an error if `grant_type` is unauthorized', async function () {
      const client = { grants: ['client_credentials'] };
      const model = {
        getClient: function () {},
        saveToken: function () {}
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120
      });
      const request = new Request({
        body: { grant_type: 'password' },
        headers: {},
        method: {},
        query: {}
      });

      try {
        await handler.handleGrantType(request, client);

        expect.fail();
      } catch (e) {
        expect(e)
          .to.be.an.instanceOf(UnauthorizedClientError)
          .and.to.have.property(
            'message',
            'Unauthorized client: `grant_type` is invalid'
          );
      }
    });

    it('throws an invalid grant error if a non-oauth error is thrown', function () {
      const client = { grants: ['password'] };
      const model = {
        getClient: function (clientId, password) {
          return client;
        },
        getUser: function (uid, pwd) {},
        saveToken: function () {}
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120
      });
      const request = new Request({
        body: { grant_type: 'password', username: 'foo', password: 'bar' },
        headers: {},
        method: {},
        query: {}
      });

      return handler
        .handleGrantType(request, client)
        .then(expect.fail)
        .catch(function (e) {
          expect(e)
            .to.be.an.instanceOf(InvalidGrantError)
            .and.to.have.property(
              'message',
              'Invalid grant: user credentials are invalid'
            );
        });
    });

    describe('with grant_type `authorization_code`', function () {
      it('returns a token', function () {
        const client = { id: 'foobar', grants: ['authorization_code'] };
        const token = {};
        const model = {
          getAuthorizationCode: function () {
            return {
              authorizationCode: 12345,
              client: { id: 'foobar' },
              expiresAt: new Date(new Date() * 2),
              user: {}
            };
          },
          getClient: function () {},
          saveToken: function () {
            return token;
          },
          validateScope: function () {
            return ['foo'];
          },
          revokeAuthorizationCode: function () {
            return {
              authorizationCode: 12345,
              client: { id: 'foobar' },
              expiresAt: new Date(new Date() / 2),
              user: {}
            };
          }
        };
        const handler = new TokenHandler({
          accessTokenLifetime: 120,
          model: model,
          refreshTokenLifetime: 120
        });
        const request = new Request({
          body: {
            code: 12345,
            grant_type: 'authorization_code'
          },
          headers: {},
          method: {},
          query: {}
        });

        return handler
          .handleGrantType(request, client)
          .then(function (data) {
            expect(data).to.equal(token);
          })
          .catch(expect.fail);
      });
    });

    describe('with PKCE', function () {
      it('returns a token when code verifier is valid using S256 code challenge method', function () {
        const codeVerifier = base64URLEncode(crypto.randomBytes(32));
        const authorizationCode = {
          authorizationCode: 12345,
          client: { id: 'foobar' },
          expiresAt: new Date(new Date().getTime() * 2),
          user: {},
          codeChallengeMethod: 'S256',
          codeChallenge: base64URLEncode(
            crypto.createHash('sha256').update(codeVerifier).digest()
          )
        };
        const client = { id: 'foobar', grants: ['authorization_code'] };
        const token = {};
        const model = {
          getAuthorizationCode: function () {
            return authorizationCode;
          },
          getClient: function () {},
          saveToken: function () {
            return token;
          },
          validateScope: function () {
            return ['foo'];
          },
          revokeAuthorizationCode: function () {
            return authorizationCode;
          }
        };
        const handler = new TokenHandler({
          accessTokenLifetime: 120,
          model: model,
          refreshTokenLifetime: 120
        });
        const request = new Request({
          body: {
            code: 12345,
            grant_type: 'authorization_code',
            code_verifier: codeVerifier
          },
          headers: {},
          method: {},
          query: {}
        });

        return handler
          .handleGrantType(request, client)
          .then(function (data) {
            expect(data).to.equal(token);
          })
          .catch(expect.fail);
      });

      it('returns a token when code verifier is valid using plain code challenge method', function () {
        const codeVerifier = base64URLEncode(crypto.randomBytes(32));
        const authorizationCode = {
          authorizationCode: 12345,
          client: { id: 'foobar' },
          expiresAt: new Date(new Date().getTime() * 2),
          user: {},
          codeChallengeMethod: 'plain',
          codeChallenge: codeVerifier
        };
        const client = { id: 'foobar', grants: ['authorization_code'] };
        const token = {};
        const model = {
          getAuthorizationCode: function () {
            return authorizationCode;
          },
          getClient: function () {},
          saveToken: function () {
            return token;
          },
          validateScope: function () {
            return ['foo'];
          },
          revokeAuthorizationCode: function () {
            return authorizationCode;
          }
        };
        const handler = new TokenHandler({
          accessTokenLifetime: 120,
          model: model,
          refreshTokenLifetime: 120
        });
        const request = new Request({
          body: {
            code: 12345,
            grant_type: 'authorization_code',
            code_verifier: codeVerifier
          },
          headers: {},
          method: {},
          query: {}
        });

        return handler
          .handleGrantType(request, client)
          .then(function (data) {
            expect(data).to.equal(token);
          })
          .catch(expect.fail);
      });

      it('throws an invalid grant error when code verifier is invalid', function () {
        const codeVerifier = base64URLEncode(crypto.randomBytes(32));
        const authorizationCode = {
          authorizationCode: 12345,
          client: { id: 'foobar' },
          expiresAt: new Date(new Date().getTime() * 2),
          user: {},
          codeChallengeMethod: 'S256',
          codeChallenge: base64URLEncode(
            crypto.createHash('sha256').update(codeVerifier).digest()
          )
        };
        const client = { id: 'foobar', grants: ['authorization_code'] };
        const token = {};
        const model = {
          getAuthorizationCode: function () {
            return authorizationCode;
          },
          getClient: function () {},
          saveToken: function () {
            return token;
          },
          validateScope: function () {
            return ['foo'];
          },
          revokeAuthorizationCode: function () {
            return authorizationCode;
          }
        };
        const handler = new TokenHandler({
          accessTokenLifetime: 120,
          model: model,
          refreshTokenLifetime: 120
        });
        const request = new Request({
          body: {
            code: 12345,
            grant_type: 'authorization_code',
            code_verifier: '123123123123123123123123123123123123123123123'
          },
          headers: {},
          method: {},
          query: {}
        });

        return handler
          .handleGrantType(request, client)
          .then(expect.fail)
          .catch(function (e) {
            expect(e)
              .to.be.an.instanceOf(InvalidGrantError)
              .and.to.have.property(
                'message',
                'Invalid grant: code verifier is invalid'
              );
          });
      });

      it('throws an invalid grant error when code verifier is missing', function () {
        const codeVerifier = base64URLEncode(crypto.randomBytes(32));
        const authorizationCode = {
          authorizationCode: 12345,
          client: { id: 'foobar' },
          expiresAt: new Date(new Date().getTime() * 2),
          user: {},
          codeChallengeMethod: 'S256',
          codeChallenge: base64URLEncode(
            crypto.createHash('sha256').update(codeVerifier).digest()
          )
        };
        const client = { id: 'foobar', grants: ['authorization_code'] };
        const token = {};
        const model = {
          getAuthorizationCode: function () {
            return authorizationCode;
          },
          getClient: function () {},
          saveToken: function () {
            return token;
          },
          validateScope: function () {
            return ['foo'];
          },
          revokeAuthorizationCode: function () {
            return authorizationCode;
          }
        };
        const handler = new TokenHandler({
          accessTokenLifetime: 120,
          model: model,
          refreshTokenLifetime: 120
        });
        const request = new Request({
          body: {
            code: 12345,
            grant_type: 'authorization_code'
          },
          headers: {},
          method: {},
          query: {}
        });

        return handler
          .handleGrantType(request, client)
          .then(expect.fail)
          .catch(function (e) {
            expect(e)
              .to.be.an.instanceOf(InvalidGrantError)
              .and.to.have.property(
                'message',
                'Missing parameter: `code_verifier`'
              );
          });
      });

      it('throws an invalid grant error when code verifier is present but code challenge is missing', function () {
        const authorizationCode = {
          authorizationCode: 12345,
          client: { id: 'foobar' },
          expiresAt: new Date(new Date().getTime() * 2),
          user: {}
        };
        const client = { id: 'foobar', grants: ['authorization_code'] };
        const token = {};
        const model = {
          getAuthorizationCode: function () {
            return authorizationCode;
          },
          getClient: function () {},
          saveToken: function () {
            return token;
          },
          validateScope: function () {
            return ['foo'];
          },
          revokeAuthorizationCode: function () {
            return authorizationCode;
          }
        };
        const handler = new TokenHandler({
          accessTokenLifetime: 120,
          model: model,
          refreshTokenLifetime: 120
        });
        const request = new Request({
          body: {
            code: 12345,
            grant_type: 'authorization_code',
            code_verifier: '123123123123123123123123123123123123123123123'
          },
          headers: {},
          method: {},
          query: {}
        });

        return handler
          .handleGrantType(request, client)
          .then(expect.fail)
          .catch(function (e) {
            expect(e)
              .to.be.an.instanceOf(InvalidGrantError)
              .and.to.have.property(
                'message',
                'Invalid grant: code verifier is invalid'
              );
          });
      });
    });

    describe('with grant_type `client_credentials`', function () {
      it('returns a token', function () {
        const client = { grants: ['client_credentials'] };
        const token = {};
        const model = {
          getClient: function () {},
          getUserFromClient: function () {
            return {};
          },
          saveToken: function () {
            return token;
          },
          validateScope: function () {
            return ['foo'];
          }
        };
        const handler = new TokenHandler({
          accessTokenLifetime: 120,
          model: model,
          refreshTokenLifetime: 120
        });
        const request = new Request({
          body: {
            grant_type: 'client_credentials',
            scope: 'foo'
          },
          headers: {},
          method: {},
          query: {}
        });

        return handler
          .handleGrantType(request, client)
          .then(function (data) {
            expect(data).to.equal(token);
          })
          .catch(expect.fail);
      });
    });

    describe('with grant_type `password`', function () {
      it('returns a token', function () {
        const client = { grants: ['password'] };
        const token = {};
        const model = {
          getClient: function () {},
          getUser: function () {
            return {};
          },
          saveToken: function () {
            return token;
          },
          validateScope: function () {
            return ['baz'];
          }
        };
        const handler = new TokenHandler({
          accessTokenLifetime: 120,
          model: model,
          refreshTokenLifetime: 120
        });
        const request = new Request({
          body: {
            client_id: 12345,
            client_secret: 'secret',
            grant_type: 'password',
            password: 'bar',
            username: 'foo',
            scope: 'baz'
          },
          headers: {},
          method: {},
          query: {}
        });

        return handler
          .handleGrantType(request, client)
          .then(function (data) {
            expect(data).to.equal(token);
          })
          .catch(expect.fail);
      });
    });

    describe('with grant_type `refresh_token`', function () {
      it('returns a token', function () {
        const client = { grants: ['refresh_token'] };
        const token = { accessToken: 'foo', client: {}, user: {} };
        const model = {
          getClient: function () {},
          getRefreshToken: function () {
            return {
              accessToken: 'foo',
              client: {},
              refreshTokenExpiresAt: new Date(new Date() * 2),
              user: {}
            };
          },
          saveToken: function () {
            return token;
          },
          revokeToken: function () {
            return {
              accessToken: 'foo',
              client: {},
              refreshTokenExpiresAt: new Date(new Date() / 2),
              user: {}
            };
          }
        };
        const handler = new TokenHandler({
          accessTokenLifetime: 120,
          model: model,
          refreshTokenLifetime: 120
        });
        const request = new Request({
          body: {
            grant_type: 'refresh_token',
            refresh_token: 12345
          },
          headers: {},
          method: {},
          query: {}
        });

        return handler
          .handleGrantType(request, client)
          .then(function (data) {
            expect(data).to.equal(token);
          })
          .catch(expect.fail);
      });
    });

    describe('with custom grant_type', function () {
      it('returns a token', function () {
        const client = {
          grants: ['urn:ietf:params:oauth:grant-type:saml2-bearer']
        };
        const token = {};
        const model = {
          getClient: function () {},
          getUser: function () {
            return {};
          },
          saveToken: function () {
            return token;
          },
          validateScope: function () {
            return ['foo'];
          }
        };
        const handler = new TokenHandler({
          accessTokenLifetime: 120,
          model: model,
          refreshTokenLifetime: 120,
          extendedGrantTypes: {
            'urn:ietf:params:oauth:grant-type:saml2-bearer': PasswordGrantType
          }
        });
        const request = new Request({
          body: {
            grant_type: 'urn:ietf:params:oauth:grant-type:saml2-bearer',
            username: 'foo',
            password: 'bar'
          },
          headers: {},
          method: {},
          query: {}
        });

        return handler
          .handleGrantType(request, client)
          .then(function (data) {
            expect(data).to.equal(token);
          })
          .catch(expect.fail);
      });
    });
  });

  describe('getAccessTokenLifetime()', function () {
    it('returns the client access token lifetime', function () {
      const client = { accessTokenLifetime: 60 };
      const model = {
        getClient: function () {
          return client;
        },
        saveToken: function () {}
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120
      });

      expect(handler.getAccessTokenLifetime(client)).to.equal(60);
    });

    it('returns the default access token lifetime', function () {
      const client = {};
      const model = {
        getClient: function () {
          return client;
        },
        saveToken: function () {}
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120
      });

      expect(handler.getAccessTokenLifetime(client)).to.equal(120);
    });
  });

  describe('getRefreshTokenLifetime()', function () {
    it('returns the client access token lifetime', function () {
      const client = { refreshTokenLifetime: 60 };
      const model = {
        getClient: function () {
          return client;
        },
        saveToken: function () {}
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120
      });

      expect(handler.getRefreshTokenLifetime(client)).to.equal(60);
    });

    it('returns the default access token lifetime', function () {
      const client = {};
      const model = {
        getClient: function () {
          return client;
        },
        saveToken: function () {}
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120
      });

      expect(handler.getRefreshTokenLifetime(client)).to.equal(120);
    });
  });

  describe('getTokenType()', function () {
    it('returns a token type', function () {
      const model = {
        getClient: function () {},
        saveToken: function () {}
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120
      });
      const tokenType = handler.getTokenType({
        accessToken: 'foo',
        refreshToken: 'bar',
        scope: ['foobar']
      });
      expect(tokenType).to.deep.include({
        accessToken: 'foo',
        accessTokenLifetime: undefined,
        refreshToken: 'bar',
        scope: ['foobar']
      });
    });
  });

  describe('updateSuccessResponse()', function () {
    it('sets the `body`', function () {
      const model = {
        getClient: function () {},
        saveToken: function () {}
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120
      });
      const tokenType = new BearerTokenType('foo', 'bar', 'biz');
      const response = new Response({ body: {}, headers: {} });

      handler.updateSuccessResponse(response, tokenType);

      expect(response.body).to.eql({
        access_token: 'foo',
        expires_in: 'bar',
        refresh_token: 'biz',
        token_type: 'Bearer'
      });
    });

    it('sets the `Cache-Control` header', function () {
      const model = {
        getClient: function () {},
        saveToken: function () {}
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120
      });
      const tokenType = new BearerTokenType('foo', 'bar', 'biz');
      const response = new Response({ body: {}, headers: {} });

      handler.updateSuccessResponse(response, tokenType);

      expect(response.get('Cache-Control')).to.equal('no-store');
    });

    it('sets the `Pragma` header', function () {
      const model = {
        getClient: function () {},
        saveToken: function () {}
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120
      });
      const tokenType = new BearerTokenType('foo', 'bar', 'biz');
      const response = new Response({ body: {}, headers: {} });

      handler.updateSuccessResponse(response, tokenType);

      expect(response.get('Pragma')).to.equal('no-cache');
    });
  });

  describe('updateErrorResponse()', function () {
    it('sets the `body`', function () {
      const error = new AccessDeniedError('Cannot request a token');
      const model = {
        getClient: function () {},
        saveToken: function () {}
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120
      });
      const response = new Response({ body: {}, headers: {} });

      handler.updateErrorResponse(response, error);

      expect(response.body.error).to.equal('access_denied');
      expect(response.body.error_description).to.equal(
        'Cannot request a token'
      );
    });

    it('sets the `status`', function () {
      const error = new AccessDeniedError('Cannot request a token');
      const model = {
        getClient: function () {},
        saveToken: function () {}
      };
      const handler = new TokenHandler({
        accessTokenLifetime: 120,
        model: model,
        refreshTokenLifetime: 120
      });
      const response = new Response({ body: {}, headers: {} });

      handler.updateErrorResponse(response, error);

      expect(response.status).to.equal(400);
    });
  });
});
