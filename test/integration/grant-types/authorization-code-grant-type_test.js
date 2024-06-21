'use strict';

/**
 * Module dependencies.
 */

import AuthorizationCodeGrantType from '../../../lib/grant-types/authorization-code-grant-type.js';
import InvalidArgumentError from '../../../lib/errors/invalid-argument-error.js';
import InvalidGrantError from '../../../lib/errors/invalid-grant-error.js';
import InvalidRequestError from '../../../lib/errors/invalid-request-error.js';
import Request from '../../../lib/request.js';
import ServerError from '../../../lib/errors/server-error.js';
import { describe, expect, it } from '../../test-utils.js';

/**
 * Test `AuthorizationCodeGrantType` integration.
 */

describe('AuthorizationCodeGrantType integration', function () {
  describe('constructor()', function () {
    it('throws an error if `model` is missing', function () {
      try {
        new AuthorizationCodeGrantType();

        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceOf(InvalidArgumentError);
        expect(e.message).to.equal('Missing parameter: `model`');
      }
    });

    it('throws an error if the model does not implement `getAuthorizationCode()`', function () {
      try {
        new AuthorizationCodeGrantType({ model: {} });

        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceOf(InvalidArgumentError);
        expect(e.message).to.equal(
          'Invalid argument: model does not implement `getAuthorizationCode()`'
        );
      }
    });

    it('throws an error if the model does not implement `revokeAuthorizationCode()`', function () {
      try {
        const model = {
          getAuthorizationCode: function () {}
        };

        new AuthorizationCodeGrantType({ model: model });

        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceOf(InvalidArgumentError);
        expect(e.message).to.equal(
          'Invalid argument: model does not implement `revokeAuthorizationCode()`'
        );
      }
    });

    it('throws an error if the model does not implement `saveToken()`', function () {
      try {
        const model = {
          getAuthorizationCode: function () {},
          revokeAuthorizationCode: function () {}
        };

        new AuthorizationCodeGrantType({ model: model });

        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceOf(InvalidArgumentError);
        expect(e.message).to.equal(
          'Invalid argument: model does not implement `saveToken()`'
        );
      }
    });
  });

  describe('handle()', function () {
    it('throws an error if `request` is missing', async function () {
      const model = {
        getAuthorizationCode: () => expect.fail(),
        revokeAuthorizationCode: () => expect.fail(),
        saveToken: () => expect.fail()
      };
      const grantType = new AuthorizationCodeGrantType({
        accessTokenLifetime: 123,
        model: model
      });

      try {
        await grantType.handle();
      } catch (e) {
        expect(e).to.be.an.instanceOf(InvalidArgumentError);
        expect(e.message).to.equal('Missing parameter: `request`');
      }
    });

    it('throws an error if `client` is invalid (not in code)', async function () {
      const client = { id: 1234 };
      const model = {
        getAuthorizationCode: function (code) {
          expect(code).equal(123456789);
          return {
            authorizationCode: 12345,
            expiresAt: new Date(new Date() * 2),
            user: {}
          };
        },
        revokeAuthorizationCode: () => expect.fail(),
        saveToken: () => expect.fail()
      };
      const grantType = new AuthorizationCodeGrantType({
        accessTokenLifetime: 123,
        model: model
      });
      const request = new Request({
        body: { code: 123456789 },
        headers: {},
        method: {},
        query: {}
      });

      try {
        await grantType.handle(request, client);
        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceOf(ServerError);
        expect(e.message).to.equal(
          'Server error: `getAuthorizationCode()` did not return a `client` object'
        );
      }
    });

    it('throws an error if `client` is missing', function () {
      const model = {
        getAuthorizationCode: () => expect.fail(),
        revokeAuthorizationCode: () => expect.fail(),
        saveToken: () => expect.fail()
      };
      const grantType = new AuthorizationCodeGrantType({
        accessTokenLifetime: 123,
        model: model
      });
      const request = new Request({
        body: { code: 12345 },
        headers: {},
        method: {},
        query: {}
      });

      try {
        grantType.handle(request, null);
      } catch (e) {
        expect(e).to.be.an.instanceOf(InvalidArgumentError);
        expect(e.message).to.equal('Missing parameter: `client`');
      }
    });

    it('returns a token', async function () {
      const client = { id: 'foobar' };
      const scope = ['fooscope'];
      const user = { name: 'foouser' };
      const codeDoc = {
        authorizationCode: 12345,
        expiresAt: new Date(new Date() * 2),
        client,
        user,
        scope
      };
      const model = {
        getAuthorizationCode: async function (code) {
          expect(code).to.equal('code-1234');

          return codeDoc;
        },
        revokeAuthorizationCode: async function (_codeDoc) {
          expect(_codeDoc).to.deep.equal(codeDoc);
          return true;
        },
        validateScope: async function (_user, _client, _scope) {
          expect(_user).to.deep.equal(user);
          expect(_client).to.deep.equal(client);
          expect(_scope).to.eql(scope);
          return scope;
        },
        generateAccessToken: async function (_client, _user, _scope) {
          expect(_user).to.deep.equal(user);
          expect(_client).to.deep.equal(client);
          expect(_scope).to.eql(scope);
          return 'long-access-token-hash';
        },
        generateRefreshToken: async function (_client, _user, _scope) {
          expect(_user).to.deep.equal(user);
          expect(_client).to.deep.equal(client);
          expect(_scope).to.eql(scope);
          return 'long-refresh-token-hash';
        },
        saveToken: async function (_token, _client, _user) {
          expect(_user).to.deep.equal(user);
          expect(_client).to.deep.equal(client);
          expect(_token.accessToken).to.equal('long-access-token-hash');
          expect(_token.refreshToken).to.equal('long-refresh-token-hash');
          expect(_token.authorizationCode).to.equal(codeDoc.authorizationCode);
          expect(_token.accessTokenExpiresAt).to.be.instanceOf(Date);
          expect(_token.refreshTokenExpiresAt).to.be.instanceOf(Date);
          return _token;
        }
      };

      const grantType = new AuthorizationCodeGrantType({
        accessTokenLifetime: 123,
        model: model
      });
      const request = new Request({
        body: { code: 'code-1234' },
        headers: {},
        method: {},
        query: {}
      });

      const token = await grantType.handle(request, client);
      expect(token.accessToken).to.equal('long-access-token-hash');
      expect(token.refreshToken).to.equal('long-refresh-token-hash');
      expect(token.authorizationCode).to.equal(codeDoc.authorizationCode);
      expect(token.accessTokenExpiresAt).to.be.instanceOf(Date);
      expect(token.refreshTokenExpiresAt).to.be.instanceOf(Date);
    });

    it('supports promises', function () {
      const client = { id: 'foobar' };
      const model = {
        getAuthorizationCode: function () {
          return {
            authorizationCode: 12345,
            client: { id: 'foobar' },
            expiresAt: new Date(new Date() * 2),
            user: {}
          };
        },
        revokeAuthorizationCode: function () {
          return true;
        },
        saveToken: function () {}
      };
      const grantType = new AuthorizationCodeGrantType({
        accessTokenLifetime: 123,
        model: model
      });
      const request = new Request({
        body: { code: 12345 },
        headers: {},
        method: {},
        query: {}
      });

      expect(grantType.handle(request, client)).to.be.an.instanceOf(Promise);
    });

    it('supports non-promises', function () {
      const client = { id: 'foobar' };
      const model = {
        getAuthorizationCode: function () {
          return {
            authorizationCode: 12345,
            client: { id: 'foobar' },
            expiresAt: new Date(new Date() * 2),
            user: {}
          };
        },
        revokeAuthorizationCode: function () {
          return true;
        },
        saveToken: function () {}
      };
      const grantType = new AuthorizationCodeGrantType({
        accessTokenLifetime: 123,
        model: model
      });
      const request = new Request({
        body: { code: 12345 },
        headers: {},
        method: {},
        query: {}
      });

      expect(grantType.handle(request, client)).to.be.an.instanceOf(Promise);
    });
  });

  describe('getAuthorizationCode()', function () {
    it('throws an error if the request body does not contain `code`', async function () {
      const client = {};
      const model = {
        getAuthorizationCode: () => expect.fail(),
        revokeAuthorizationCode: () => expect.fail(),
        saveToken: () => expect.fail()
      };
      const grantType = new AuthorizationCodeGrantType({
        accessTokenLifetime: 123,
        model: model
      });
      const request = new Request({
        body: {},
        headers: {},
        method: {},
        query: {}
      });

      try {
        await grantType.getAuthorizationCode(request, client);
      } catch (e) {
        expect(e).to.be.an.instanceOf(InvalidRequestError);
        expect(e.message).to.equal('Missing parameter: `code`');
      }
    });

    it('throws an error if `code` is invalid', async function () {
      const client = {};
      const model = {
        getAuthorizationCode: () => expect.fail(),
        revokeAuthorizationCode: () => expect.fail(),
        saveToken: () => expect.fail()
      };
      const grantType = new AuthorizationCodeGrantType({
        accessTokenLifetime: 123,
        model: model
      });
      const request = new Request({
        body: { code: 'øå€£‰' },
        headers: {},
        method: {},
        query: {}
      });

      try {
        await grantType.getAuthorizationCode(request, client);
        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceOf(InvalidRequestError);
        expect(e.message).to.equal('Invalid parameter: `code`');
      }
    });

    it('throws an error if `authorizationCode` is missing', async function () {
      const client = {};
      const model = {
        getAuthorizationCode: async function () {},
        revokeAuthorizationCode: () => expect.fail(),
        saveToken: () => expect.fail()
      };
      const grantType = new AuthorizationCodeGrantType({
        accessTokenLifetime: 123,
        model: model
      });
      const request = new Request({
        body: { code: 12345 },
        headers: {},
        method: {},
        query: {}
      });

      try {
        await grantType.getAuthorizationCode(request, client);
        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceOf(InvalidGrantError);
        expect(e.message).to.equal(
          'Invalid grant: authorization code is invalid'
        );
      }
    });

    it('throws an error if `authorizationCode.client` is missing', async function () {
      const client = {};
      const model = {
        getAuthorizationCode: async function () {
          return { authorizationCode: 12345 };
        },
        revokeAuthorizationCode: () => expect.fail(),
        saveToken: () => expect.fail()
      };
      const grantType = new AuthorizationCodeGrantType({
        accessTokenLifetime: 123,
        model: model
      });
      const request = new Request({
        body: { code: 12345 },
        headers: {},
        method: {},
        query: {}
      });

      try {
        await grantType.getAuthorizationCode(request, client);
        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceOf(ServerError);
        expect(e.message).to.equal(
          'Server error: `getAuthorizationCode()` did not return a `client` object'
        );
      }
    });

    it('throws an error if `authorizationCode.expiresAt` is missing', async function () {
      const client = {};
      const model = {
        getAuthorizationCode: async function () {
          return { authorizationCode: 12345, client: {}, user: {} };
        },
        revokeAuthorizationCode: () => expect.fail(),
        saveToken: () => expect.fail()
      };
      const grantType = new AuthorizationCodeGrantType({
        accessTokenLifetime: 123,
        model: model
      });
      const request = new Request({
        body: { code: 12345 },
        headers: {},
        method: {},
        query: {}
      });

      try {
        await grantType.getAuthorizationCode(request, client);
        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceOf(ServerError);
        expect(e.message).to.equal(
          'Server error: `expiresAt` must be a Date instance'
        );
      }
    });

    it('throws an error if `authorizationCode.user` is missing', async function () {
      const client = {};
      const model = {
        getAuthorizationCode: async function () {
          return {
            authorizationCode: 12345,
            client: {},
            expiresAt: new Date()
          };
        },
        revokeAuthorizationCode: () => expect.fail(),
        saveToken: () => expect.fail()
      };
      const grantType = new AuthorizationCodeGrantType({
        accessTokenLifetime: 123,
        model: model
      });
      const request = new Request({
        body: { code: 12345 },
        headers: {},
        method: {},
        query: {}
      });

      try {
        await grantType.getAuthorizationCode(request, client);
        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceOf(ServerError);
        expect(e.message).to.equal(
          'Server error: `getAuthorizationCode()` did not return a `user` object'
        );
      }
    });

    it('throws an error if the client id does not match', async function () {
      const client = { id: 123 };
      const model = {
        getAuthorizationCode: async function () {
          return {
            authorizationCode: 12345,
            expiresAt: new Date(),
            client: { id: 456 },
            user: {}
          };
        },
        revokeAuthorizationCode: () => expect.fail(),
        saveToken: () => expect.fail()
      };
      const grantType = new AuthorizationCodeGrantType({
        accessTokenLifetime: 123,
        model: model
      });
      const request = new Request({
        body: { code: 12345 },
        headers: {},
        method: {},
        query: {}
      });

      try {
        await grantType.getAuthorizationCode(request, client);
        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceOf(InvalidGrantError);
        expect(e.message).to.equal(
          'Invalid grant: authorization code is invalid'
        );
      }
    });

    it('throws an error if the auth code is expired', async function () {
      const client = { id: 123 };
      const date = new Date(new Date() / 2);
      const model = {
        getAuthorizationCode: async function () {
          return {
            authorizationCode: 12345,
            client: { id: 123 },
            expiresAt: date,
            user: {}
          };
        },
        revokeAuthorizationCode: () => expect.fail(),
        saveToken: () => expect.fail()
      };
      const grantType = new AuthorizationCodeGrantType({
        accessTokenLifetime: 123,
        model: model
      });
      const request = new Request({
        body: { code: 12345 },
        headers: {},
        method: {},
        query: {}
      });

      try {
        await grantType.getAuthorizationCode(request, client);
        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceOf(InvalidGrantError);
        expect(e.message).to.equal(
          'Invalid grant: authorization code has expired'
        );
      }
    });

    it('throws an error if the `redirectUri` is invalid (format)', async function () {
      const authorizationCode = {
        authorizationCode: 12345,
        client: { id: 'foobar' },
        expiresAt: new Date(new Date() * 2),
        redirectUri: 'foobar',
        user: {}
      };
      const client = { id: 'foobar' };
      const model = {
        getAuthorizationCode: async function () {
          return authorizationCode;
        },
        revokeAuthorizationCode: () => expect.fail(),
        saveToken: () => expect.fail()
      };
      const grantType = new AuthorizationCodeGrantType({
        accessTokenLifetime: 123,
        model: model
      });
      const request = new Request({
        body: { code: 12345 },
        headers: {},
        method: {},
        query: {}
      });

      try {
        await grantType.getAuthorizationCode(request, client);
        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceOf(InvalidGrantError);
        expect(e.message).to.equal(
          'Invalid grant: `redirect_uri` is not a valid URI'
        );
      }
    });

    it('returns an auth code', async function () {
      const authorizationCode = {
        authorizationCode: 1234567,
        client: { id: 'foobar' },
        expiresAt: new Date(new Date() * 2),
        user: {}
      };
      const client = { id: 'foobar' };
      const model = {
        getAuthorizationCode: async function (_code) {
          expect(_code).to.equal(12345);
          return authorizationCode;
        },
        revokeAuthorizationCode: () => expect.fail(),
        saveToken: () => expect.fail()
      };
      const grantType = new AuthorizationCodeGrantType({
        accessTokenLifetime: 123,
        model: model
      });
      const request = new Request({
        body: { code: 12345 },
        headers: {},
        method: {},
        query: {}
      });

      const code = await grantType.getAuthorizationCode(request, client);
      expect(code).to.deep.equal(authorizationCode);
    });

    it('supports promises', function () {
      const authorizationCode = {
        authorizationCode: 12345,
        client: { id: 'foobar' },
        expiresAt: new Date(new Date() * 2),
        user: {}
      };
      const client = { id: 'foobar' };
      const model = {
        getAuthorizationCode: async function () {
          return authorizationCode;
        },
        revokeAuthorizationCode: function () {},
        saveToken: function () {}
      };
      const grantType = new AuthorizationCodeGrantType({
        accessTokenLifetime: 123,
        model: model
      });
      const request = new Request({
        body: { code: 12345 },
        headers: {},
        method: {},
        query: {}
      });

      expect(
        grantType.getAuthorizationCode(request, client)
      ).to.be.an.instanceOf(Promise);
    });

    it('supports non-promises', function () {
      const authorizationCode = {
        authorizationCode: 12345,
        client: { id: 'foobar' },
        expiresAt: new Date(new Date() * 2),
        user: {}
      };
      const client = { id: 'foobar' };
      const model = {
        getAuthorizationCode: function () {
          return authorizationCode;
        },
        revokeAuthorizationCode: function () {},
        saveToken: function () {}
      };
      const grantType = new AuthorizationCodeGrantType({
        accessTokenLifetime: 123,
        model: model
      });
      const request = new Request({
        body: { code: 12345 },
        headers: {},
        method: {},
        query: {}
      });

      expect(
        grantType.getAuthorizationCode(request, client)
      ).to.be.an.instanceOf(Promise);
    });
  });

  describe('validateRedirectUri()', function () {
    it('throws an error if `redirectUri` is missing', function () {
      const authorizationCode = {
        authorizationCode: 12345,
        client: {},
        expiresAt: new Date(new Date() / 2),
        redirectUri: 'http://foo.bar',
        user: {}
      };
      const model = {
        getAuthorizationCode: function () {},
        revokeAuthorizationCode: function () {
          return authorizationCode;
        },
        saveToken: function () {}
      };
      const grantType = new AuthorizationCodeGrantType({
        accessTokenLifetime: 123,
        model: model
      });
      const request = new Request({
        body: { code: 12345 },
        headers: {},
        method: {},
        query: {}
      });

      try {
        grantType.validateRedirectUri(request, authorizationCode);

        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceOf(InvalidRequestError);
        expect(e.message).to.equal(
          'Invalid request: `redirect_uri` is not a valid URI'
        );
      }
    });

    it('throws an error if `redirectUri` is invalid', function () {
      const authorizationCode = {
        authorizationCode: 12345,
        client: {},
        expiresAt: new Date(new Date() / 2),
        redirectUri: 'http://foo.bar',
        user: {}
      };
      const model = {
        getAuthorizationCode: function () {},
        revokeAuthorizationCode: function () {
          return true;
        },
        saveToken: function () {}
      };
      const grantType = new AuthorizationCodeGrantType({
        accessTokenLifetime: 123,
        model: model
      });
      const request = new Request({
        body: { code: 12345, redirect_uri: 'http://bar.foo' },
        headers: {},
        method: {},
        query: {}
      });

      try {
        grantType.validateRedirectUri(request, authorizationCode);

        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceOf(InvalidRequestError);
        expect(e.message).to.equal(
          'Invalid request: `redirect_uri` is invalid'
        );
      }
    });

    it('returns undefined and does not throw if `redirectUri` is valid', async function () {
      const authorizationCode = {
        authorizationCode: 12345,
        client: {},
        expiresAt: new Date(new Date() / 2),
        redirectUri: 'http://foo.bar',
        user: {}
      };
      const model = {
        getAuthorizationCode: function () {},
        revokeAuthorizationCode: function () {
          return true;
        },
        saveToken: function () {}
      };
      const grantType = new AuthorizationCodeGrantType({
        accessTokenLifetime: 123,
        model: model
      });
      const request = new Request({
        body: { code: 12345, redirect_uri: 'http://foo.bar' },
        headers: {},
        method: {},
        query: {}
      });

      expect(grantType.validateRedirectUri(request, authorizationCode)).to.be
        .undefined;
    });
  });

  describe('revokeAuthorizationCode()', function () {
    it('revokes the auth code', async function () {
      const authorizationCode = {
        authorizationCode: 12345,
        client: {},
        expiresAt: new Date(new Date() / 2),
        user: {}
      };
      const model = {
        getAuthorizationCode: () => expect.fail(),
        revokeAuthorizationCode: async function (_code) {
          expect(_code).to.equal(authorizationCode);
          return true;
        },
        saveToken: () => expect.fail()
      };
      const grantType = new AuthorizationCodeGrantType({
        accessTokenLifetime: 123,
        model: model
      });

      const data = await grantType.revokeAuthorizationCode(authorizationCode);
      expect(data).to.deep.equal(authorizationCode);
    });

    it('throws an error when the auth code is invalid', async function () {
      const authorizationCode = {
        authorizationCode: 12345,
        client: {},
        expiresAt: new Date(new Date() / 2),
        user: {}
      };
      const returnTypes = [false, null, undefined, 0, ''];

      for (const type of returnTypes) {
        const model = {
          getAuthorizationCode: () => expect.fail(),
          revokeAuthorizationCode: async function (_code) {
            expect(_code).to.equal(authorizationCode);
            return type;
          },
          saveToken: () => expect.fail()
        };
        const grantType = new AuthorizationCodeGrantType({
          accessTokenLifetime: 123,
          model: model
        });

        try {
          await grantType.revokeAuthorizationCode(authorizationCode);
          expect.fail();
        } catch (e) {
          expect(e).to.be.an.instanceOf(InvalidGrantError);
          expect(e.message).to.equal(
            'Invalid grant: authorization code is invalid'
          );
        }
      }
    });

    it('supports promises', function () {
      const authorizationCode = {
        authorizationCode: 12345,
        client: {},
        expiresAt: new Date(new Date() / 2),
        user: {}
      };
      const model = {
        getAuthorizationCode: () => expect.fail(),
        revokeAuthorizationCode: async function () {
          return true;
        },
        saveToken: () => expect.fail()
      };
      const grantType = new AuthorizationCodeGrantType({
        accessTokenLifetime: 123,
        model: model
      });
      expect(
        grantType.revokeAuthorizationCode(authorizationCode)
      ).to.be.an.instanceOf(Promise);
    });

    it('supports non-promises', function () {
      const authorizationCode = {
        authorizationCode: 12345,
        client: {},
        expiresAt: new Date(new Date() / 2),
        user: {}
      };
      const model = {
        getAuthorizationCode: () => expect.fail(),
        revokeAuthorizationCode: function () {
          return authorizationCode;
        },
        saveToken: () => expect.fail()
      };
      const grantType = new AuthorizationCodeGrantType({
        accessTokenLifetime: 123,
        model: model
      });
      expect(
        grantType.revokeAuthorizationCode(authorizationCode)
      ).to.be.an.instanceOf(Promise);
    });
  });

  describe('saveToken()', function () {
    it('saves the token', async function () {
      const token = { foo: 'bar' };
      const model = {
        getAuthorizationCode: () => expect.fail(),
        revokeAuthorizationCode: () => expect.fail(),
        saveToken: function (_token, _client = 'fallback', _user = 'fallback') {
          expect(_token.accessToken).to.be.a.sha256();
          expect(_token.accessTokenExpiresAt).to.be.instanceOf(Date);
          expect(_token.refreshTokenExpiresAt).to.be.instanceOf(Date);
          expect(_token.refreshToken).to.be.a.sha256();
          expect(_token.scope).to.eql(['foo']);
          expect(_token.authorizationCode).to.be.undefined;
          expect(_user).to.equal('fallback');
          expect(_client).to.equal('fallback');
          return token;
        },
        validateScope: function (
          _user = 'fallback',
          _client = 'fallback',
          _scope = ['fallback']
        ) {
          expect(_user).to.equal('fallback');
          expect(_client).to.equal('fallback');
          expect(_scope).to.eql(['fallback']);
          return ['foo'];
        }
      };
      const grantType = new AuthorizationCodeGrantType({
        accessTokenLifetime: 123,
        model: model
      });
      const data = await grantType.saveToken();
      expect(data).to.equal(token);
    });

    it('supports promises', function () {
      const token = {};
      const model = {
        getAuthorizationCode: function () {},
        revokeAuthorizationCode: function () {},
        saveToken: async function () {
          return token;
        }
      };
      const grantType = new AuthorizationCodeGrantType({
        accessTokenLifetime: 123,
        model: model
      });

      expect(grantType.saveToken(token)).to.be.an.instanceOf(Promise);
    });

    it('supports non-promises', function () {
      const token = {};
      const model = {
        getAuthorizationCode: function () {},
        revokeAuthorizationCode: function () {},
        saveToken: function () {
          return token;
        }
      };
      const grantType = new AuthorizationCodeGrantType({
        accessTokenLifetime: 123,
        model: model
      });

      expect(grantType.saveToken(token)).to.be.an.instanceOf(Promise);
    });
  });
});
