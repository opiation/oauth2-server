'use strict';

/**
 * Module dependencies.
 */

import AbstractGrantType from '../../../lib/grant-types/abstract-grant-type.js';
import InvalidArgumentError from '../../../lib/errors/invalid-argument-error.js';
import Request from '../../../lib/request.js';
import InvalidScopeError from '../../../lib/errors/invalid-scope-error.js';
import { describe, expect, it } from '../../test-utils.js';

/**
 * Test `AbstractGrantType` integration.
 */

describe('AbstractGrantType integration', function () {
  describe('constructor()', function () {
    it('throws an error if `options.accessTokenLifetime` is missing', function () {
      try {
        new AbstractGrantType();

        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceOf(InvalidArgumentError);
        expect(e.message).to.equal('Missing parameter: `accessTokenLifetime`');
      }
    });

    it('throws an error if `options.model` is missing', function () {
      try {
        new AbstractGrantType({ accessTokenLifetime: 123 });

        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceOf(InvalidArgumentError);
        expect(e.message).to.equal('Missing parameter: `model`');
      }
    });

    it('sets the `accessTokenLifetime`', function () {
      const grantType = new AbstractGrantType({
        accessTokenLifetime: 123,
        model: {}
      });

      expect(grantType.accessTokenLifetime).to.equal(123);
    });

    it('sets the `model`', function () {
      const model = { async generateAccessToken() {} };
      const grantType = new AbstractGrantType({
        accessTokenLifetime: 123,
        model: model
      });

      expect(grantType.model).to.equal(model);
    });

    it('sets the `refreshTokenLifetime`', function () {
      const grantType = new AbstractGrantType({
        accessTokenLifetime: 123,
        model: {},
        refreshTokenLifetime: 456
      });

      expect(grantType.refreshTokenLifetime).to.equal(456);
    });
  });

  describe('generateAccessToken()', function () {
    it('returns an access token', async function () {
      const handler = new AbstractGrantType({
        accessTokenLifetime: 123,
        model: {},
        refreshTokenLifetime: 456
      });
      const accessToken = await handler.generateAccessToken();
      expect(accessToken).to.be.a.sha256();
    });

    it('supports promises', async function () {
      const model = {
        generateAccessToken: async function () {
          return 'long-hash-foo-bar';
        }
      };
      const handler = new AbstractGrantType({
        accessTokenLifetime: 123,
        model: model,
        refreshTokenLifetime: 456
      });
      const accessToken = await handler.generateAccessToken();
      expect(accessToken).to.equal('long-hash-foo-bar');
    });

    it('supports non-promises', async function () {
      const model = {
        generateAccessToken: function () {
          return 'long-hash-foo-bar';
        }
      };
      const handler = new AbstractGrantType({
        accessTokenLifetime: 123,
        model: model,
        refreshTokenLifetime: 456
      });
      const accessToken = await handler.generateAccessToken();
      expect(accessToken).to.equal('long-hash-foo-bar');
    });
  });

  describe('generateRefreshToken()', function () {
    it('returns a refresh token', async function () {
      const handler = new AbstractGrantType({
        accessTokenLifetime: 123,
        model: {},
        refreshTokenLifetime: 456
      });
      const refreshToken = await handler.generateRefreshToken();
      expect(refreshToken).to.be.a.sha256();
    });

    it('supports promises', async function () {
      const model = {
        generateRefreshToken: async function () {
          return 'long-hash-foo-bar';
        }
      };
      const handler = new AbstractGrantType({
        accessTokenLifetime: 123,
        model: model,
        refreshTokenLifetime: 456
      });
      const refreshToken = await handler.generateRefreshToken();
      expect(refreshToken).to.equal('long-hash-foo-bar');
    });

    it('supports non-promises', async function () {
      const model = {
        generateRefreshToken: function () {
          return 'long-hash-foo-bar';
        }
      };
      const handler = new AbstractGrantType({
        accessTokenLifetime: 123,
        model: model,
        refreshTokenLifetime: 456
      });
      const refreshToken = await handler.generateRefreshToken();
      expect(refreshToken).to.equal('long-hash-foo-bar');
    });
  });

  describe('getAccessTokenExpiresAt()', function () {
    it('returns a date', function () {
      const handler = new AbstractGrantType({
        accessTokenLifetime: 123,
        model: {},
        refreshTokenLifetime: 456
      });

      expect(handler.getAccessTokenExpiresAt()).to.be.an.instanceOf(Date);
    });
  });

  describe('getRefreshTokenExpiresAt()', function () {
    it('returns a refresh token', function () {
      const handler = new AbstractGrantType({
        accessTokenLifetime: 123,
        model: {},
        refreshTokenLifetime: 456
      });

      expect(handler.getRefreshTokenExpiresAt()).to.be.an.instanceOf(Date);
    });
  });

  describe('getScope()', function () {
    it('throws an error if `scope` is invalid', function () {
      const handler = new AbstractGrantType({
        accessTokenLifetime: 123,
        model: {},
        refreshTokenLifetime: 456
      });
      const request = new Request({
        body: { scope: 'øå€£‰' },
        headers: {},
        method: {},
        query: {}
      });

      try {
        handler.getScope(request);

        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceOf(InvalidScopeError);
        expect(e.message).to.equal('Invalid parameter: `scope`');
      }
    });

    it('allows the `scope` to be `undefined`', function () {
      const handler = new AbstractGrantType({
        accessTokenLifetime: 123,
        model: {},
        refreshTokenLifetime: 456
      });
      const request = new Request({
        body: {},
        headers: {},
        method: {},
        query: {}
      });

      expect(handler.getScope(request)).to.not.exist;
    });

    it('returns the scope', function () {
      const handler = new AbstractGrantType({
        accessTokenLifetime: 123,
        model: {},
        refreshTokenLifetime: 456
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

  describe('validateScope()', function () {
    it('accepts the scope, if the model does not implement it', async function () {
      const scope = ['some,scope,this,that'];
      const user = { id: 123 };
      const client = { id: 456 };
      const handler = new AbstractGrantType({
        accessTokenLifetime: 123,
        model: {},
        refreshTokenLifetime: 456
      });
      const validated = await handler.validateScope(user, client, scope);
      expect(validated).to.eql(scope);
    });

    it('accepts the scope, if the model accepts it', async function () {
      const scope = ['some,scope,this,that'];
      const user = { id: 123 };
      const client = { id: 456 };

      const model = {
        async validateScope(_user, _client, _scope) {
          // make sure the model received the correct args
          expect(_user).to.deep.equal(user);
          expect(_client).to.deep.equal(_client);
          expect(_scope).to.eql(scope);

          return scope;
        }
      };
      const handler = new AbstractGrantType({
        accessTokenLifetime: 123,
        model,
        refreshTokenLifetime: 456
      });
      const validated = await handler.validateScope(user, client, scope);
      expect(validated).to.eql(scope);
    });

    it('throws if the model rejects the scope', async function () {
      const scope = ['some,scope,this,that'];
      const user = { id: 123 };
      const client = { id: 456 };
      const returnTypes = [undefined, null, false, 0, ''];

      for (const type of returnTypes) {
        const model = {
          async validateScope(_user, _client, _scope) {
            // make sure the model received the correct args
            expect(_user).to.deep.equal(user);
            expect(_client).to.deep.equal(_client);
            expect(_scope).to.eql(scope);

            return type;
          }
        };
        const handler = new AbstractGrantType({
          accessTokenLifetime: 123,
          model,
          refreshTokenLifetime: 456
        });

        try {
          await handler.validateScope(user, client, scope);
          expect.fail();
        } catch (e) {
          expect(e).to.be.an.instanceOf(InvalidScopeError);
          expect(e.message).to.equal(
            'Invalid scope: Requested scope is invalid'
          );
        }
      }
    });
  });
});
