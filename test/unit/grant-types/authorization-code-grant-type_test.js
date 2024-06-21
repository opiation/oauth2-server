'use strict';

/**
 * Module dependencies.
 */

import crypto from 'node:crypto';
import AuthorizationCodeGrantType from '../../../lib/grant-types/authorization-code-grant-type.js';
import InvalidGrantError from '../../../lib/errors/invalid-grant-error.js';
import ServerError from '../../../lib/errors/server-error.js';
import Request from '../../../lib/request.js';
import { base64URLEncode } from '../../../lib/utils/string-util.js';
import { describe, expect, it, sinon } from '../../test-utils.js';

/**
 * Test `AuthorizationCodeGrantType`.
 */

describe('AuthorizationCodeGrantType', function () {
  describe('getAuthorizationCode()', function () {
    it('calls `model.getAuthorizationCode()`', function () {
      const model = {
        getAuthorizationCode: sinon.stub().returns({
          authorizationCode: 12345,
          client: {},
          expiresAt: new Date(new Date() * 2),
          user: {}
        }),
        revokeAuthorizationCode: function () {},
        saveToken: function () {}
      };
      const handler = new AuthorizationCodeGrantType({
        accessTokenLifetime: 120,
        model: model
      });
      const request = new Request({
        body: { code: 12345 },
        headers: {},
        method: {},
        query: {}
      });
      const client = {};

      return handler
        .getAuthorizationCode(request, client)
        .then(function () {
          expect(model.getAuthorizationCode.callCount).to.equal(1);
          expect(model.getAuthorizationCode.firstCall.args).to.have.length(1);
          expect(model.getAuthorizationCode.firstCall.args[0]).to.equal(12345);
          expect(model.getAuthorizationCode.firstCall.thisValue).to.equal(
            model
          );
        })
        .catch(expect.fail);
    });
  });

  describe('revokeAuthorizationCode()', function () {
    it('calls `model.revokeAuthorizationCode()`', function () {
      const model = {
        getAuthorizationCode: function () {},
        revokeAuthorizationCode: sinon.stub().returns(true),
        saveToken: function () {}
      };
      const handler = new AuthorizationCodeGrantType({
        accessTokenLifetime: 120,
        model: model
      });
      const authorizationCode = {};

      return handler
        .revokeAuthorizationCode(authorizationCode)
        .then(function () {
          expect(model.revokeAuthorizationCode.callCount).to.equal(1);
          expect(model.revokeAuthorizationCode.firstCall.args).to.have.length(
            1
          );
          expect(model.revokeAuthorizationCode.firstCall.args[0]).to.equal(
            authorizationCode
          );
          expect(model.revokeAuthorizationCode.firstCall.thisValue).to.equal(
            model
          );
        })
        .catch(expect.fail);
    });
  });

  describe('saveToken()', function () {
    it('calls `model.saveToken()`', function () {
      const client = {};
      const user = {};
      const model = {
        getAuthorizationCode: function () {},
        revokeAuthorizationCode: function () {},
        saveToken: sinon.stub().returns(true)
      };
      const handler = new AuthorizationCodeGrantType({
        accessTokenLifetime: 120,
        model: model
      });

      sinon.stub(handler, 'validateScope').returns(['foobiz']);
      sinon
        .stub(handler, 'generateAccessToken')
        .returns(Promise.resolve('foo'));
      sinon
        .stub(handler, 'generateRefreshToken')
        .returns(Promise.resolve('bar'));
      sinon
        .stub(handler, 'getAccessTokenExpiresAt')
        .returns(Promise.resolve('biz'));
      sinon
        .stub(handler, 'getRefreshTokenExpiresAt')
        .returns(Promise.resolve('baz'));

      return handler
        .saveToken(user, client, 'foobar', ['foobiz'])
        .then(function () {
          expect(model.saveToken.callCount).to.equal(1);
          expect(model.saveToken.firstCall.args).to.have.length(3);
          expect(model.saveToken.firstCall.args[0]).to.eql({
            accessToken: 'foo',
            authorizationCode: 'foobar',
            accessTokenExpiresAt: 'biz',
            refreshToken: 'bar',
            refreshTokenExpiresAt: 'baz',
            scope: ['foobiz']
          });
          expect(model.saveToken.firstCall.args[1]).to.equal(client);
          expect(model.saveToken.firstCall.args[2]).to.equal(user);
          expect(model.saveToken.firstCall.thisValue).to.equal(model);
        })
        .catch(expect.fail);
    });
  });

  describe('with PKCE', function () {
    it('throws an error if the `code_verifier` is invalid with S256 code challenge method', function () {
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
      const client = { id: 'foobar', isPublic: true };
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
        body: { code: 12345, code_verifier: 'foo' },
        headers: {},
        method: {},
        query: {}
      });

      return grantType
        .getAuthorizationCode(request, client)
        .then(expect.fail)
        .catch(function (e) {
          expect(e)
            .to.be.an.instanceOf(InvalidGrantError)
            .and.have.a.property('message')
            .that.equals('Invalid grant: code verifier is invalid');
        });
    });

    it('throws an error in getAuthorizationCode if an invalid code challenge method has been saved', function () {
      const codeVerifier = base64URLEncode(crypto.randomBytes(32));
      const authorizationCode = {
        authorizationCode: 12345,
        client: { id: 'foobar', isPublic: true },
        expiresAt: new Date(new Date().getTime() * 2),
        user: {},
        codeChallengeMethod: 'foobar', // assume this bypassed validation
        codeChallenge: base64URLEncode(
          crypto.createHash('sha256').update(codeVerifier).digest()
        )
      };
      const client = { id: 'foobar', isPublic: true };
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
        body: { code: 12345, code_verifier: codeVerifier },
        headers: {},
        method: {},
        query: {}
      });

      return grantType
        .getAuthorizationCode(request, client)
        .then(expect.fail)
        .catch(function (e) {
          expect(e)
            .to.be.an.instanceOf(ServerError)
            .and.have.a.property('message')
            .that.equals(
              'Server error: `getAuthorizationCode()` did not return a valid `codeChallengeMethod` property'
            );
        });
    });

    it('throws an error if the `code_verifier` is invalid with plain code challenge method', function () {
      const codeVerifier = base64URLEncode(crypto.randomBytes(32));
      const authorizationCode = {
        authorizationCode: 12345,
        client: { id: 'foobar' },
        expiresAt: new Date(new Date().getTime() * 2),
        user: {},
        codeChallengeMethod: 'plain',
        codeChallenge: codeVerifier
      };
      // fixme: The isPublic option is not used, as a result any client which allows authorization_code grant also accepts PKCE requests.
      const client = { id: 'foobar', isPublic: true };
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
        body: { code: 12345, code_verifier: 'foo' },
        headers: {},
        method: {},
        query: {}
      });

      return grantType
        .getAuthorizationCode(request, client)
        .then(expect.fail)
        .catch(function (e) {
          expect(e)
            .to.be.an.instanceOf(InvalidGrantError)
            .and.have.a.property('message')
            .that.equals('Invalid grant: code verifier is invalid');
        });
    });

    it('returns an auth code when `code_verifier` is valid with S256 code challenge method', function () {
      const codeVerifier = base64URLEncode(crypto.randomBytes(32));
      const authorizationCode = {
        authorizationCode: 12345,
        client: { id: 'foobar', isPublic: true },
        expiresAt: new Date(new Date().getTime() * 2),
        user: {},
        codeChallengeMethod: 'S256',
        codeChallenge: base64URLEncode(
          crypto.createHash('sha256').update(codeVerifier).digest()
        )
      };
      const client = { id: 'foobar', isPublic: true };
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
        body: { code: 12345, code_verifier: codeVerifier },
        headers: {},
        method: {},
        query: {}
      });

      return grantType
        .getAuthorizationCode(request, client)
        .then(function (data) {
          expect(data).to.equal(authorizationCode);
        })
        .catch(expect.fail);
    });

    it('returns an auth code when `code_verifier` is valid with plain code challenge method', function () {
      const codeVerifier = base64URLEncode(crypto.randomBytes(32));
      const authorizationCode = {
        authorizationCode: 12345,
        client: { id: 'foobar' },
        expiresAt: new Date(new Date().getTime() * 2),
        user: {},
        codeChallengeMethod: 'plain',
        codeChallenge: codeVerifier
      };
      const client = { id: 'foobar', isPublic: true };
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
        body: { code: 12345, code_verifier: codeVerifier },
        headers: {},
        method: {},
        query: {}
      });

      return grantType
        .getAuthorizationCode(request, client)
        .then(function (data) {
          expect(data).to.equal(authorizationCode);
        })
        .catch(expect.fail);
    });
  });
});
