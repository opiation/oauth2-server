'use strict';

/**
 * Module dependencies.
 */

import InvalidArgumentError from '../../../lib/errors/invalid-argument-error.js';
import InvalidGrantError from '../../../lib/errors/invalid-grant-error.js';
import InvalidRequestError from '../../../lib/errors/invalid-request-error.js';
import RefreshTokenGrantType from '../../../lib/grant-types/refresh-token-grant-type.js';
import Request from '../../../lib/request.js';
import ServerError from '../../../lib/errors/server-error.js';
import { describe, expect, it } from '../../test-utils.js';

/**
 * Test `RefreshTokenGrantType` integration.
 */

describe('RefreshTokenGrantType integration', function () {
  describe('constructor()', function () {
    it('throws an error if `model` is missing', function () {
      try {
        new RefreshTokenGrantType();

        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceOf(InvalidArgumentError);
        expect(e.message).to.equal('Missing parameter: `model`');
      }
    });

    it('throws an error if the model does not implement `getRefreshToken()`', function () {
      try {
        new RefreshTokenGrantType({ model: {} });

        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceOf(InvalidArgumentError);
        expect(e.message).to.equal(
          'Invalid argument: model does not implement `getRefreshToken()`'
        );
      }
    });

    it('throws an error if the model does not implement `revokeToken()`', function () {
      try {
        const model = {
          getRefreshToken: () => expect.fail()
        };

        new RefreshTokenGrantType({ model });

        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceOf(InvalidArgumentError);
        expect(e.message).to.equal(
          'Invalid argument: model does not implement `revokeToken()`'
        );
      }
    });

    it('throws an error if the model does not implement `saveToken()`', function () {
      try {
        const model = {
          getRefreshToken: () => expect.fail(),
          revokeToken: () => expect.fail()
        };

        new RefreshTokenGrantType({ model });

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
        getRefreshToken: () => expect.fail(),
        revokeToken: () => expect.fail(),
        saveToken: () => expect.fail()
      };
      const grantType = new RefreshTokenGrantType({
        accessTokenLifetime: 120,
        model
      });

      try {
        await grantType.handle();

        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceOf(InvalidArgumentError);
        expect(e.message).to.equal('Missing parameter: `request`');
      }
    });

    it('throws an error if `client` is missing', async function () {
      const model = {
        getRefreshToken: () => expect.fail(),
        revokeToken: () => expect.fail(),
        saveToken: () => expect.fail()
      };
      const grantType = new RefreshTokenGrantType({
        accessTokenLifetime: 120,
        model
      });
      const request = new Request({
        body: {},
        headers: {},
        method: {},
        query: {}
      });

      try {
        await grantType.handle(request);

        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceOf(InvalidArgumentError);
        expect(e.message).to.equal('Missing parameter: `client`');
      }
    });

    it('returns a token', async function () {
      const client = { id: 123 };
      const token = {
        accessToken: 'foo',
        client: { id: 123 },
        user: { name: 'foo' },
        scope: ['read', 'write'],
        refreshTokenExpiresAt: new Date(new Date() * 2)
      };
      const model = {
        getRefreshToken: async function (_refreshToken) {
          expect(_refreshToken).to.equal('foobar_refresh');
          return token;
        },
        revokeToken: async function (_token) {
          expect(_token).to.deep.equal(token);
          return true;
        },
        generateAccessToken: async function (_client, _user, _scope) {
          expect(_user).to.deep.equal({ name: 'foo' });
          expect(_client).to.deep.equal({ id: 123 });
          expect(_scope).to.eql(['read', 'write']);
          return 'new-access-token';
        },
        generateRefreshToken: async function (_client, _user, _scope) {
          expect(_user).to.deep.equal({ name: 'foo' });
          expect(_client).to.deep.equal({ id: 123 });
          expect(_scope).to.eql(['read', 'write']);
          return 'new-refresh-token';
        },
        saveToken: async function (_token, _client, _user) {
          expect(_user).to.deep.equal({ name: 'foo' });
          expect(_client).to.deep.equal({ id: 123 });
          expect(_token.accessToken).to.equal('new-access-token');
          expect(_token.refreshToken).to.equal('new-refresh-token');
          expect(_token.accessTokenExpiresAt).to.be.instanceOf(Date);
          expect(_token.refreshTokenExpiresAt).to.be.instanceOf(Date);
          return token;
        }
      };

      const grantType = new RefreshTokenGrantType({
        accessTokenLifetime: 123,
        model
      });
      const request = new Request({
        body: { refresh_token: 'foobar_refresh' },
        headers: {},
        method: {},
        query: {}
      });
      const data = await grantType.handle(request, client);
      expect(data).to.equal(token);
    });

    it('supports promises', function () {
      const client = { id: 123 };
      const model = {
        getRefreshToken: async function () {
          return { accessToken: 'foo', client: { id: 123 }, user: {} };
        },
        revokeToken: async function () {
          return {
            accessToken: 'foo',
            client: {},
            refreshTokenExpiresAt: new Date(new Date() / 2),
            user: {}
          };
        },
        saveToken: async function () {
          return { accessToken: 'foo', client: {}, user: {} };
        }
      };
      const grantType = new RefreshTokenGrantType({
        accessTokenLifetime: 123,
        model
      });
      const request = new Request({
        body: { refresh_token: 'foobar' },
        headers: {},
        method: {},
        query: {}
      });

      expect(grantType.handle(request, client)).to.be.an.instanceOf(Promise);
    });

    it('supports non-promises', function () {
      const client = { id: 123 };
      const model = {
        getRefreshToken: async function () {
          return { accessToken: 'foo', client: { id: 123 }, user: {} };
        },
        revokeToken: async function () {
          return {
            accessToken: 'foo',
            client: {},
            refreshTokenExpiresAt: new Date(new Date() / 2),
            user: {}
          };
        },
        saveToken: async function () {
          return { accessToken: 'foo', client: {}, user: {} };
        }
      };
      const grantType = new RefreshTokenGrantType({
        accessTokenLifetime: 123,
        model
      });
      const request = new Request({
        body: { refresh_token: 'foobar' },
        headers: {},
        method: {},
        query: {}
      });

      expect(grantType.handle(request, client)).to.be.an.instanceOf(Promise);
    });
  });

  describe('getRefreshToken()', function () {
    it('throws an error if the `refreshToken` parameter is missing from the request body', async function () {
      const client = {};
      const model = {
        getRefreshToken: () => expect.fail(),
        revokeToken: () => expect.fail(),
        saveToken: () => expect.fail()
      };
      const grantType = new RefreshTokenGrantType({
        accessTokenLifetime: 120,
        model
      });
      const request = new Request({
        body: {},
        headers: {},
        method: {},
        query: {}
      });

      try {
        await grantType.getRefreshToken(request, client);

        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceOf(InvalidRequestError);
        expect(e.message).to.equal('Missing parameter: `refresh_token`');
      }
    });

    it('throws an error if `refreshToken` is not found', async function () {
      const client = { id: 123 };
      const model = {
        getRefreshToken: async function () {},
        revokeToken: () => expect.fail(),
        saveToken: () => expect.fail()
      };
      const grantType = new RefreshTokenGrantType({
        accessTokenLifetime: 120,
        model
      });
      const request = new Request({
        body: { refresh_token: '12345' },
        headers: {},
        method: {},
        query: {}
      });

      try {
        await grantType.getRefreshToken(request, client);

        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceOf(InvalidGrantError);
        expect(e.message).to.equal('Invalid grant: refresh token is invalid');
      }
    });

    it('throws an error if `refreshToken.client` is missing', async function () {
      const client = {};
      const model = {
        getRefreshToken: async function () {
          return {};
        },
        revokeToken: () => expect.fail(),
        saveToken: () => expect.fail()
      };
      const grantType = new RefreshTokenGrantType({
        accessTokenLifetime: 120,
        model
      });
      const request = new Request({
        body: { refresh_token: 12345 },
        headers: {},
        method: {},
        query: {}
      });

      try {
        await grantType.getRefreshToken(request, client);

        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceOf(ServerError);
        expect(e.message).to.equal(
          'Server error: `getRefreshToken()` did not return a `client` object'
        );
      }
    });

    it('throws an error if `refreshToken.user` is missing', async function () {
      const client = {};
      const model = {
        getRefreshToken: async function () {
          return { accessToken: 'foo', client: {} };
        },
        revokeToken: () => expect.fail(),
        saveToken: () => expect.fail()
      };
      const grantType = new RefreshTokenGrantType({
        accessTokenLifetime: 120,
        model
      });
      const request = new Request({
        body: { refresh_token: 12345 },
        headers: {},
        method: {},
        query: {}
      });

      try {
        await grantType.getRefreshToken(request, client);

        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceOf(ServerError);
        expect(e.message).to.equal(
          'Server error: `getRefreshToken()` did not return a `user` object'
        );
      }
    });

    it('throws an error if the client id does not match', async function () {
      const client = { id: 123 };
      const model = {
        getRefreshToken: async function () {
          return { accessToken: 'foo', client: { id: 456 }, user: {} };
        },
        revokeToken: () => expect.fail(),
        saveToken: () => expect.fail()
      };
      const grantType = new RefreshTokenGrantType({
        accessTokenLifetime: 120,
        model
      });
      const request = new Request({
        body: { refresh_token: 12345 },
        headers: {},
        method: {},
        query: {}
      });

      try {
        await grantType.getRefreshToken(request, client);

        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceOf(InvalidGrantError);
        expect(e.message).to.equal(
          'Invalid grant: refresh token was issued to another client'
        );
      }
    });

    it('throws an error if `refresh_token` contains invalid characters', async function () {
      const client = {};
      const model = {
        getRefreshToken: async function () {
          return { client: { id: 456 }, user: {} };
        },
        revokeToken: () => expect.fail(),
        saveToken: () => expect.fail()
      };
      const grantType = new RefreshTokenGrantType({
        accessTokenLifetime: 120,
        model
      });
      const request = new Request({
        body: { refresh_token: 'øå€£‰' },
        headers: {},
        method: {},
        query: {}
      });

      try {
        await grantType.getRefreshToken(request, client);

        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceOf(InvalidRequestError);
        expect(e.message).to.equal('Invalid parameter: `refresh_token`');
      }
    });

    it('throws an error if `refresh_token` is missing', async function () {
      const client = {};
      const model = {
        getRefreshToken: async function () {
          return { accessToken: 'foo', client: { id: 456 }, user: {} };
        },
        revokeToken: () => expect.fail(),
        saveToken: () => expect.fail()
      };
      const grantType = new RefreshTokenGrantType({
        accessTokenLifetime: 120,
        model
      });
      const request = new Request({
        body: { refresh_token: 12345 },
        headers: {},
        method: {},
        query: {}
      });

      try {
        await grantType.getRefreshToken(request, client);

        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceOf(InvalidGrantError);
        expect(e.message).to.equal(
          'Invalid grant: refresh token was issued to another client'
        );
      }
    });

    it('throws an error if `refresh_token` is expired', async function () {
      const client = { id: 123 };
      const date = new Date(new Date() / 2);
      const model = {
        getRefreshToken: async function () {
          return {
            accessToken: 'foo',
            client: { id: 123 },
            refreshTokenExpiresAt: date,
            user: {}
          };
        },
        revokeToken: () => expect.fail(),
        saveToken: () => expect.fail()
      };
      const grantType = new RefreshTokenGrantType({
        accessTokenLifetime: 120,
        model
      });
      const request = new Request({
        body: { refresh_token: 12345 },
        headers: {},
        method: {},
        query: {}
      });

      try {
        await grantType.getRefreshToken(request, client);

        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceOf(InvalidGrantError);
        expect(e.message).to.equal('Invalid grant: refresh token has expired');
      }
    });

    it('throws an error if `refreshTokenExpiresAt` is not a date value', async function () {
      const client = { id: 123 };
      const model = {
        getRefreshToken: async function () {
          return {
            accessToken: 'foo',
            client: { id: 123 },
            refreshTokenExpiresAt: 'stringvalue',
            user: {}
          };
        },
        revokeToken: () => expect.fail(),
        saveToken: () => expect.fail()
      };
      const grantType = new RefreshTokenGrantType({
        accessTokenLifetime: 120,
        model
      });
      const request = new Request({
        body: { refresh_token: 12345 },
        headers: {},
        method: {},
        query: {}
      });

      try {
        await grantType.getRefreshToken(request, client);

        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceOf(ServerError);
        expect(e.message).to.equal(
          'Server error: `refreshTokenExpiresAt` must be a Date instance'
        );
      }
    });

    it('returns a token', async function () {
      const client = { id: 123 };
      const token = {
        accessToken: 'foo',
        client: { id: 123 },
        user: { name: 'foobar' }
      };
      const model = {
        getRefreshToken: async function (_refreshToken) {
          expect(_refreshToken).to.equal('foobar_refresh');
          return token;
        },
        revokeToken: async function (_token) {
          expect(_token).to.deep.equal(token);
          return true;
        },
        saveToken: async function (_token, _client, _user) {
          expect(_user).to.deep.equal(token.user);
          expect(_client).to.deep.equal(client);
          expect(_token.accessToken).to.be.a.sha256();
          expect(_token.refreshToken).to.be.a.sha256();
          expect(_token.accessTokenExpiresAt).to.be.instanceOf(Date);
          expect(_token.refreshTokenExpiresAt).to.be.instanceOf(Date);
          return token;
        }
      };
      const grantType = new RefreshTokenGrantType({
        accessTokenLifetime: 123,
        model
      });
      const request = new Request({
        body: { refresh_token: 'foobar_refresh' },
        headers: {},
        method: {},
        query: {}
      });

      const data = await grantType.getRefreshToken(request, client);
      expect(data).to.equal(token);
    });

    it('supports promises', function () {
      const client = { id: 123 };
      const token = { accessToken: 'foo', client: { id: 123 }, user: {} };
      const model = {
        getRefreshToken: async function () {
          return token;
        },
        revokeToken: async function () {},
        saveToken: async function () {}
      };
      const grantType = new RefreshTokenGrantType({
        accessTokenLifetime: 123,
        model
      });
      const request = new Request({
        body: { refresh_token: 'foobar' },
        headers: {},
        method: {},
        query: {}
      });

      expect(grantType.getRefreshToken(request, client)).to.be.an.instanceOf(
        Promise
      );
    });

    it('supports non-promises', function () {
      const client = { id: 123 };
      const token = { accessToken: 'foo', client: { id: 123 }, user: {} };
      const model = {
        getRefreshToken: async function () {
          return token;
        },
        revokeToken: async function () {},
        saveToken: async function () {}
      };
      const grantType = new RefreshTokenGrantType({
        accessTokenLifetime: 123,
        model
      });
      const request = new Request({
        body: { refresh_token: 'foobar' },
        headers: {},
        method: {},
        query: {}
      });

      expect(grantType.getRefreshToken(request, client)).to.be.an.instanceOf(
        Promise
      );
    });
  });

  describe('revokeToken()', function () {
    it('throws an error if the `token` is invalid', async function () {
      const model = {
        getRefreshToken: () => expect.fail(),
        revokeToken: async () => {},
        saveToken: () => expect.fail()
      };
      const grantType = new RefreshTokenGrantType({
        accessTokenLifetime: 120,
        model
      });

      try {
        await grantType.revokeToken({});
        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceOf(InvalidGrantError);
        expect(e.message).to.equal(
          'Invalid grant: refresh token is invalid or could not be revoked'
        );
      }
    });

    it('revokes the token', async function () {
      const token = {
        accessToken: 'foo',
        client: {},
        refreshTokenExpiresAt: new Date(new Date() / 2),
        user: {}
      };
      const model = {
        getRefreshToken: () => expect.fail(),
        revokeToken: async function (_token) {
          expect(_token).to.deep.equal(token);
          return token;
        },
        saveToken: () => expect.fail()
      };
      const grantType = new RefreshTokenGrantType({
        accessTokenLifetime: 123,
        model
      });

      const data = await grantType.revokeToken(token);
      expect(data).to.equal(token);
    });

    it('supports promises', function () {
      const token = {
        accessToken: 'foo',
        client: {},
        refreshTokenExpiresAt: new Date(new Date() / 2),
        user: {}
      };
      const model = {
        getRefreshToken: () => expect.fail(),
        revokeToken: async function () {
          return token;
        },
        saveToken: () => expect.fail()
      };
      const grantType = new RefreshTokenGrantType({
        accessTokenLifetime: 123,
        model
      });

      expect(grantType.revokeToken(token)).to.be.an.instanceOf(Promise);
    });

    it('supports non-promises', function () {
      const token = {
        accessToken: 'foo',
        client: {},
        refreshTokenExpiresAt: new Date(new Date() / 2),
        user: {}
      };
      const model = {
        getRefreshToken: () => expect.fail(),
        revokeToken: function () {
          return token;
        },
        saveToken: () => expect.fail()
      };
      const grantType = new RefreshTokenGrantType({
        accessTokenLifetime: 123,
        model
      });

      expect(grantType.revokeToken(token)).to.be.an.instanceOf(Promise);
    });
  });

  describe('saveToken()', function () {
    it('saves the token', async function () {
      const user = { name: 'foo' };
      const client = { id: 123465 };
      const scope = ['foo', 'bar'];
      const model = {
        getRefreshToken: () => expect.fail(),
        revokeToken: () => expect.fail(),
        saveToken: async function (_token, _client, _user) {
          expect(_user).to.deep.equal(user);
          expect(_client).to.deep.equal(client);
          expect(_token.scope).to.deep.eql(scope);
          expect(_token.accessToken).to.be.a.sha256();
          expect(_token.refreshToken).to.be.a.sha256();
          expect(_token.accessTokenExpiresAt).to.be.instanceOf(Date);
          expect(_token.refreshTokenExpiresAt).to.be.instanceOf(Date);
          return { ..._token };
        }
      };
      const grantType = new RefreshTokenGrantType({
        accessTokenLifetime: 123,
        model
      });

      const data = await grantType.saveToken(user, client, scope);
      expect(data.accessToken).to.be.a.sha256();
      expect(data.refreshToken).to.be.a.sha256();
      expect(data.accessTokenExpiresAt).to.be.instanceOf(Date);
      expect(data.refreshTokenExpiresAt).to.be.instanceOf(Date);
      expect(data.scope).to.deep.equal(scope);
    });

    it('supports promises', function () {
      const token = {};
      const model = {
        getRefreshToken: () => expect.fail(),
        revokeToken: () => expect.fail(),
        saveToken: async function () {
          return token;
        }
      };
      const grantType = new RefreshTokenGrantType({
        accessTokenLifetime: 123,
        model
      });

      expect(grantType.saveToken(token)).to.be.an.instanceOf(Promise);
    });

    it('supports non-promises', function () {
      const token = {};
      const model = {
        getRefreshToken: () => expect.fail(),
        revokeToken: () => expect.fail(),
        saveToken: function () {
          return token;
        }
      };
      const grantType = new RefreshTokenGrantType({
        accessTokenLifetime: 123,
        model
      });

      expect(grantType.saveToken(token)).to.be.an.instanceOf(Promise);
    });
  });
});
