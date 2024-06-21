'use strict';

/**
 * Module dependencies.
 */

import ClientCredentialsGrantType from '../../../lib/grant-types/client-credentials-grant-type.js';
import InvalidArgumentError from '../../../lib/errors/invalid-argument-error.js';
import InvalidGrantError from '../../../lib/errors/invalid-grant-error.js';
import Request from '../../../lib/request.js';
import { describe, expect, it } from '../../test-utils.js';

/**
 * Test `ClientCredentialsGrantType` integration.
 */

describe('ClientCredentialsGrantType integration', function () {
  describe('constructor()', function () {
    it('throws an error if `model` is missing', function () {
      try {
        new ClientCredentialsGrantType();

        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceOf(InvalidArgumentError);
        expect(e.message).to.equal('Missing parameter: `model`');
      }
    });

    it('throws an error if the model does not implement `getUserFromClient()`', function () {
      try {
        new ClientCredentialsGrantType({ model: {} });

        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceOf(InvalidArgumentError);
        expect(e.message).to.equal(
          'Invalid argument: model does not implement `getUserFromClient()`'
        );
      }
    });

    it('throws an error if the model does not implement `saveToken()`', function () {
      try {
        const model = {
          getUserFromClient: function () {}
        };

        new ClientCredentialsGrantType({ model: model });

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
        getUserFromClient: function () {},
        saveToken: function () {}
      };
      const grantType = new ClientCredentialsGrantType({
        accessTokenLifetime: 120,
        model: model
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
        getUserFromClient: function () {},
        saveToken: function () {}
      };
      const grantType = new ClientCredentialsGrantType({
        accessTokenLifetime: 120,
        model: model
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
      const token = {};
      const client = { foo: 'bar' };
      const user = { name: 'foo' };
      const scope = ['fooscope'];

      const model = {
        getUserFromClient: async function (_client) {
          expect(_client).to.deep.equal(client);
          return { ...user };
        },
        saveToken: async function (_token, _client, _user) {
          expect(_client).to.deep.equal(client);
          expect(_user).to.deep.equal(user);
          expect(_token.accessToken).to.equal('long-access-token-hash');
          expect(_token.accessTokenExpiresAt).to.be.instanceOf(Date);
          expect(_token.scope).to.eql(scope);
          return token;
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
        }
      };
      const grantType = new ClientCredentialsGrantType({
        accessTokenLifetime: 120,
        model: model
      });
      const request = new Request({
        body: { scope: scope.join(' ') },
        headers: {},
        method: {},
        query: {}
      });

      const data = await grantType.handle(request, client);
      expect(data).to.equal(token);
    });

    it('supports promises', function () {
      const token = {};
      const model = {
        getUserFromClient: async function () {
          return {};
        },
        saveToken: async function () {
          return token;
        }
      };
      const grantType = new ClientCredentialsGrantType({
        accessTokenLifetime: 120,
        model: model
      });
      const request = new Request({
        body: {},
        headers: {},
        method: {},
        query: {}
      });

      expect(grantType.handle(request, {})).to.be.an.instanceOf(Promise);
    });

    it('supports non-promises', function () {
      const token = {};
      const model = {
        getUserFromClient: function () {
          return {};
        },
        saveToken: function () {
          return token;
        }
      };
      const grantType = new ClientCredentialsGrantType({
        accessTokenLifetime: 120,
        model: model
      });
      const request = new Request({
        body: {},
        headers: {},
        method: {},
        query: {}
      });

      expect(grantType.handle(request, {})).to.be.an.instanceOf(Promise);
    });
  });

  describe('getUserFromClient()', function () {
    it('throws an error if `user` is missing', function () {
      const model = {
        getUserFromClient: function () {},
        saveToken: () => expect.fail()
      };
      const grantType = new ClientCredentialsGrantType({
        accessTokenLifetime: 120,
        model: model
      });
      const request = new Request({
        body: {},
        headers: {},
        method: {},
        query: {}
      });

      return grantType
        .getUserFromClient(request, {})
        .then(expect.fail)
        .catch(function (e) {
          expect(e).to.be.an.instanceOf(InvalidGrantError);
          expect(e.message).to.equal(
            'Invalid grant: user credentials are invalid'
          );
        });
    });

    it('returns a user', function () {
      const user = { email: 'foo@bar.com' };
      const model = {
        getUserFromClient: function () {
          return user;
        },
        saveToken: () => expect.fail()
      };
      const grantType = new ClientCredentialsGrantType({
        accessTokenLifetime: 120,
        model: model
      });
      const request = new Request({
        body: {},
        headers: {},
        method: {},
        query: {}
      });

      return grantType
        .getUserFromClient(request, {})
        .then(function (data) {
          expect(data).to.equal(user);
        })
        .catch(expect.fail);
    });

    it('supports promises', function () {
      const user = { email: 'foo@bar.com' };
      const model = {
        getUserFromClient: async function () {
          return user;
        },
        saveToken: () => expect.fail()
      };
      const grantType = new ClientCredentialsGrantType({
        accessTokenLifetime: 120,
        model: model
      });
      const request = new Request({
        body: {},
        headers: {},
        method: {},
        query: {}
      });

      expect(grantType.getUserFromClient(request, {})).to.be.an.instanceOf(
        Promise
      );
    });

    it('supports non-promises', function () {
      const user = { email: 'foo@bar.com' };
      const model = {
        getUserFromClient: function () {
          return user;
        },
        saveToken: () => expect.fail()
      };
      const grantType = new ClientCredentialsGrantType({
        accessTokenLifetime: 120,
        model: model
      });
      const request = new Request({
        body: {},
        headers: {},
        method: {},
        query: {}
      });

      expect(grantType.getUserFromClient(request, {})).to.be.an.instanceOf(
        Promise
      );
    });
  });

  describe('saveToken()', function () {
    it('saves the token', async function () {
      const token = {};
      const model = {
        getUserFromClient: () => expect.fail(),
        saveToken: function () {
          return token;
        },
        validateScope: function () {
          return ['foo'];
        }
      };
      const grantType = new ClientCredentialsGrantType({
        accessTokenLifetime: 123,
        model: model
      });
      const data = await grantType.saveToken(token);
      expect(data).to.equal(token);
    });

    it('supports promises', function () {
      const token = {};
      const model = {
        getUserFromClient: () => expect.fail(),
        saveToken: async function () {
          return token;
        }
      };
      const grantType = new ClientCredentialsGrantType({
        accessTokenLifetime: 123,
        model: model
      });

      expect(grantType.saveToken(token)).to.be.an.instanceOf(Promise);
    });

    it('supports non-promises', function () {
      const token = {};
      const model = {
        getUserFromClient: () => expect.fail(),
        saveToken: function () {
          return token;
        }
      };
      const grantType = new ClientCredentialsGrantType({
        accessTokenLifetime: 123,
        model: model
      });

      expect(grantType.saveToken(token)).to.be.an.instanceOf(Promise);
    });
  });
});
