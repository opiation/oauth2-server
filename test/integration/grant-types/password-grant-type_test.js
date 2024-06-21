'use strict';

/**
 * Module dependencies.
 */

import InvalidArgumentError from '../../../lib/errors/invalid-argument-error.js';
import InvalidGrantError from '../../../lib/errors/invalid-grant-error.js';
import InvalidRequestError from '../../../lib/errors/invalid-request-error.js';
import PasswordGrantType from '../../../lib/grant-types/password-grant-type.js';
import Request from '../../../lib/request.js';
import { describe, expect, it } from '../../test-utils.js';

/**
 * Test `PasswordGrantType` integration.
 */

describe('PasswordGrantType integration', function () {
  describe('constructor()', function () {
    it('throws an error if `model` is missing', function () {
      try {
        new PasswordGrantType();

        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceOf(InvalidArgumentError);
        expect(e.message).to.equal('Missing parameter: `model`');
      }
    });

    it('throws an error if the model does not implement `getUser()`', function () {
      try {
        new PasswordGrantType({ model: {} });

        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceOf(InvalidArgumentError);
        expect(e.message).to.equal(
          'Invalid argument: model does not implement `getUser()`'
        );
      }
    });

    it('throws an error if the model does not implement `saveToken()`', function () {
      try {
        const model = {
          getUser: function () {}
        };

        new PasswordGrantType({ model });

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
        getUser: () => expect.fail(),
        saveToken: () => expect.fail()
      };
      const grantType = new PasswordGrantType({
        accessTokenLifetime: 123,
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
        getUser: () => expect.fail(),
        saveToken: () => expect.fail()
      };
      const grantType = new PasswordGrantType({
        accessTokenLifetime: 123,
        model
      });

      try {
        await grantType.handle({});

        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceOf(InvalidArgumentError);
        expect(e.message).to.equal('Missing parameter: `client`');
      }
    });

    it('returns a token', async function () {
      const client = { id: 'foobar' };
      const scope = ['baz'];
      const token = {};
      const user = {
        id: 123456,
        username: 'foo',
        email: 'foo@example.com'
      };

      const model = {
        getUser: async function (username, password) {
          expect(username).to.equal('foo');
          expect(password).to.equal('bar');
          return user;
        },
        validateScope: async function (_user, _client, _scope) {
          expect(_client).to.equal(client);
          expect(_user).to.equal(user);
          expect(_scope).to.eql(scope);
          return scope;
        },
        generateAccessToken: async function (_client, _user, _scope) {
          expect(_client).to.equal(client);
          expect(_user).to.equal(user);
          expect(_scope).to.eql(scope);
          return 'long-access-token-hash';
        },
        generateRefreshToken: async function (_client, _user, _scope) {
          expect(_client).to.equal(client);
          expect(_user).to.equal(user);
          expect(_scope).to.eql(scope);
          return 'long-refresh-token-hash';
        },
        saveToken: async function (_token, _client, _user) {
          expect(_client).to.equal(client);
          expect(_user).to.equal(user);
          expect(_token.accessToken).to.equal('long-access-token-hash');
          expect(_token.refreshToken).to.equal('long-refresh-token-hash');
          expect(_token.accessTokenExpiresAt).to.be.instanceOf(Date);
          expect(_token.refreshTokenExpiresAt).to.be.instanceOf(Date);
          return token;
        }
      };

      const grantType = new PasswordGrantType({
        accessTokenLifetime: 123,
        model
      });
      const request = new Request({
        body: { username: 'foo', password: 'bar', scope: 'baz' },
        headers: {},
        method: {},
        query: {}
      });

      const data = await grantType.handle(request, client);
      expect(data).to.equal(token);
    });

    it('supports promises', async function () {
      const client = { id: 'foobar' };
      const token = {};
      const model = {
        getUser: async function () {
          return {};
        },
        saveToken: async function () {
          return token;
        }
      };
      const grantType = new PasswordGrantType({
        accessTokenLifetime: 123,
        model
      });
      const request = new Request({
        body: { username: 'foo', password: 'bar' },
        headers: {},
        method: {},
        query: {}
      });

      const result = await grantType.handle(request, client);
      expect(result).to.deep.equal({});
    });

    it('supports non-promises', async function () {
      const client = { id: 'foobar' };
      const token = {};
      const model = {
        getUser: function () {
          return {};
        },
        saveToken: function () {
          return token;
        }
      };
      const grantType = new PasswordGrantType({
        accessTokenLifetime: 123,
        model
      });
      const request = new Request({
        body: { username: 'foo', password: 'bar' },
        headers: {},
        method: {},
        query: {}
      });

      const result = await grantType.handle(request, client);
      expect(result).to.deep.equal({});
    });
  });

  describe('getUser()', function () {
    it('throws an error if the request body does not contain `username`', async function () {
      const model = {
        getUser: () => expect.fail(),
        saveToken: () => expect.fail()
      };
      const client = { id: 'foobar' };
      const grantType = new PasswordGrantType({
        accessTokenLifetime: 123,
        model
      });
      const request = new Request({
        body: {},
        headers: {},
        method: {},
        query: {}
      });

      try {
        await grantType.getUser(request, client);

        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceOf(InvalidRequestError);
        expect(e.message).to.equal('Missing parameter: `username`');
      }
    });

    it('throws an error if the request body does not contain `password`', async function () {
      const model = {
        getUser: () => expect.fail(),
        saveToken: () => expect.fail()
      };
      const client = { id: 'foobar' };
      const grantType = new PasswordGrantType({
        accessTokenLifetime: 123,
        model
      });
      const request = new Request({
        body: { username: 'foo' },
        headers: {},
        method: {},
        query: {}
      });

      try {
        await grantType.getUser(request, client);

        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceOf(InvalidRequestError);
        expect(e.message).to.equal('Missing parameter: `password`');
      }
    });

    it('throws an error if `username` is invalid', async function () {
      const model = {
        getUser: () => expect.fail(),
        saveToken: () => expect.fail()
      };
      const client = { id: 'foobar' };
      const grantType = new PasswordGrantType({
        accessTokenLifetime: 123,
        model
      });
      const request = new Request({
        body: { username: '\r\n', password: 'foobar' },
        headers: {},
        method: {},
        query: {}
      });

      try {
        await grantType.getUser(request, client);

        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceOf(InvalidRequestError);
        expect(e.message).to.equal('Invalid parameter: `username`');
      }
    });

    it('throws an error if `password` is invalid', async function () {
      const model = {
        getUser: () => expect.fail(),
        saveToken: () => expect.fail()
      };
      const client = { id: 'foobar' };
      const grantType = new PasswordGrantType({
        accessTokenLifetime: 123,
        model
      });
      const request = new Request({
        body: { username: 'foobar', password: '\r\n' },
        headers: {},
        method: {},
        query: {}
      });

      try {
        await grantType.getUser(request, client);

        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceOf(InvalidRequestError);
        expect(e.message).to.equal('Invalid parameter: `password`');
      }
    });

    it('throws an error if `user` is missing', async function () {
      const model = {
        getUser: async () => undefined,
        saveToken: () => expect.fail()
      };
      const client = { id: 'foobar' };
      const grantType = new PasswordGrantType({
        accessTokenLifetime: 123,
        model
      });
      const request = new Request({
        body: { username: 'foo', password: 'bar' },
        headers: {},
        method: {},
        query: {}
      });

      try {
        await grantType.getUser(request, client);
        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceOf(InvalidGrantError);
        expect(e.message).to.equal(
          'Invalid grant: user credentials are invalid'
        );
      }
    });

    it('returns a user', async function () {
      const user = { email: 'foo@bar.com' };
      const client = { id: 'foobar' };
      const model = {
        getUser: function (username, password) {
          expect(username).to.equal('foo');
          expect(password).to.equal('bar');
          return user;
        },
        saveToken: () => expect.fail()
      };
      const grantType = new PasswordGrantType({
        accessTokenLifetime: 123,
        model
      });
      const request = new Request({
        body: { username: 'foo', password: 'bar' },
        headers: {},
        method: {},
        query: {}
      });

      const data = await grantType.getUser(request, client);
      expect(data).to.equal(user);
    });

    it('supports promises', function () {
      const user = { email: 'foo@bar.com' };
      const client = { id: 'foobar' };
      const model = {
        getUser: async function () {
          return user;
        },
        saveToken: () => expect.fail()
      };
      const grantType = new PasswordGrantType({
        accessTokenLifetime: 123,
        model
      });
      const request = new Request({
        body: { username: 'foo', password: 'bar' },
        headers: {},
        method: {},
        query: {}
      });

      expect(grantType.getUser(request, client)).to.be.an.instanceOf(Promise);
    });

    it('supports non-promises', function () {
      const user = { email: 'foo@bar.com' };
      const client = { id: 'foobar' };
      const model = {
        getUser: function () {
          return user;
        },
        saveToken: () => expect.fail()
      };
      const grantType = new PasswordGrantType({
        accessTokenLifetime: 123,
        model
      });
      const request = new Request({
        body: { username: 'foo', password: 'bar' },
        headers: {},
        method: {},
        query: {}
      });

      expect(grantType.getUser(request, client)).to.be.an.instanceOf(Promise);
    });
  });

  describe('saveToken()', function () {
    it('saves the token', async function () {
      const token = {};
      const model = {
        getUser: () => expect.fail(),
        saveToken: async function (
          _token,
          _client = 'fallback',
          _user = 'fallback'
        ) {
          expect(_token.accessToken).to.be.a.sha256();
          expect(_token.accessTokenExpiresAt).to.be.instanceOf(Date);
          expect(_token.refreshTokenExpiresAt).to.be.instanceOf(Date);
          expect(_token.refreshToken).to.be.a.sha256();
          expect(_token.scope).to.eql(['foo']);
          expect(_client).to.equal('fallback');
          expect(_user).to.equal('fallback');
          return token;
        },
        validateScope: async function (_scope = ['fallback']) {
          expect(_scope).to.eql(['fallback']);
          return ['foo'];
        }
      };
      const grantType = new PasswordGrantType({
        accessTokenLifetime: 123,
        model
      });

      const data = await grantType.saveToken();
      expect(data).to.equal(token);
    });

    it('supports promises', function () {
      const token = {};
      const model = {
        getUser: () => expect.fail(),
        saveToken: async function () {
          return token;
        }
      };
      const grantType = new PasswordGrantType({
        accessTokenLifetime: 123,
        model
      });

      expect(grantType.saveToken(token)).to.be.an.instanceOf(Promise);
    });

    it('supports non-promises', function () {
      const token = {};
      const model = {
        getUser: () => expect.fail(),
        saveToken: function () {
          return token;
        }
      };
      const grantType = new PasswordGrantType({
        accessTokenLifetime: 123,
        model
      });

      expect(grantType.saveToken(token)).to.be.an.instanceOf(Promise);
    });
  });
});
