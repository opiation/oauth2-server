'use strict';

/**
 * Module dependencies.
 */

import AuthorizeHandler from '../../../lib/handlers/authorize-handler.js';
import Request from '../../../lib/request.js';
import Response from '../../../lib/response.js';
import { describe, expect, it, sinon } from '../../test-utils.js';

/**
 * Test `AuthorizeHandler`.
 */

describe('AuthorizeHandler', function () {
  describe('generateAuthorizationCode()', function () {
    it('calls `model.generateAuthorizationCode()`', function () {
      const model = {
        generateAuthorizationCode: sinon.stub().returns({}),
        getAccessToken: function () {},
        getClient: function () {},
        saveAuthorizationCode: function () {}
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model: model
      });

      return handler
        .generateAuthorizationCode()
        .then(function () {
          expect(model.generateAuthorizationCode.callCount).to.equal(1);
          expect(model.generateAuthorizationCode.firstCall.thisValue).to.equal(
            model
          );
        })
        .catch(expect.fail);
    });
  });

  describe('getClient()', function () {
    it('calls `model.getClient()`', function () {
      const model = {
        getAccessToken: function () {},
        getClient: sinon.stub().returns({
          grants: ['authorization_code'],
          redirectUris: ['http://example.com/cb']
        }),
        saveAuthorizationCode: function () {}
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model: model
      });
      const request = new Request({
        body: { client_id: 12345, client_secret: 'secret' },
        headers: {},
        method: {},
        query: {}
      });

      return handler
        .getClient(request)
        .then(function () {
          expect(model.getClient.callCount).to.equal(1);
          expect(model.getClient.firstCall.args).to.have.length(2);
          expect(model.getClient.firstCall.args[0]).to.equal(12345);
          expect(model.getClient.firstCall.thisValue).to.equal(model);
        })
        .catch(expect.fail);
    });
  });

  describe('getUser()', function () {
    it('calls `authenticateHandler.getUser()`', function () {
      const authenticateHandler = {
        handle: sinon.stub().returns(Promise.resolve({}))
      };
      const model = {
        getClient: function () {},
        saveAuthorizationCode: function () {}
      };
      const handler = new AuthorizeHandler({
        authenticateHandler: authenticateHandler,
        authorizationCodeLifetime: 120,
        model: model
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
        .then(function () {
          expect(authenticateHandler.handle.callCount).to.equal(1);
          expect(authenticateHandler.handle.firstCall.args).to.deep.equal([
            request,
            response
          ]);
        })
        .catch(expect.fail);
    });
  });

  describe('saveAuthorizationCode()', function () {
    it('calls `model.saveAuthorizationCode()`', function () {
      const model = {
        getAccessToken: function () {},
        getClient: function () {},
        saveAuthorizationCode: sinon.stub().returns({})
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model: model
      });

      return handler
        .saveAuthorizationCode('foo', 'bar', ['qux'], 'biz', 'baz', 'boz')
        .then(function () {
          expect(model.saveAuthorizationCode.callCount).to.equal(1);
          expect(model.saveAuthorizationCode.firstCall).to.deep.include({
            args: [
              {
                authorizationCode: 'foo',
                expiresAt: 'bar',
                redirectUri: 'baz',
                scope: ['qux']
              },
              'biz',
              'boz'
            ],
            thisValue: model
          });
        })
        .catch(expect.fail);
    });

    it('calls `model.saveAuthorizationCode()` with code challenge', function () {
      const model = {
        getAccessToken: function () {},
        getClient: function () {},
        saveAuthorizationCode: sinon.stub().returns({})
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model: model
      });

      return handler
        .saveAuthorizationCode(
          'foo',
          'bar',
          ['qux'],
          'biz',
          'baz',
          'boz',
          'codeChallenge',
          'codeChallengeMethod'
        )
        .then(function () {
          expect(model.saveAuthorizationCode.callCount).to.equal(1);
          expect(model.saveAuthorizationCode.firstCall).to.deep.include({
            args: [
              {
                authorizationCode: 'foo',
                expiresAt: 'bar',
                redirectUri: 'baz',
                scope: ['qux'],
                codeChallenge: 'codeChallenge',
                codeChallengeMethod: 'codeChallengeMethod'
              },
              'biz',
              'boz'
            ],
            thisValue: model
          });
        })
        .catch(expect.fail);
    });
  });

  describe('validateRedirectUri()', function () {
    it('calls `model.validateRedirectUri()`', function () {
      const client = {
        grants: ['authorization_code'],
        redirectUris: ['http://example.com/cb']
      };
      const redirect_uri = 'http://example.com/cb/2';
      const model = {
        getAccessToken: function () {},
        getClient: sinon.stub().returns(client),
        saveAuthorizationCode: function () {},
        validateRedirectUri: sinon.stub().returns(true)
      };
      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model: model
      });
      const request = new Request({
        body: { client_id: 12345, client_secret: 'secret', redirect_uri },
        headers: {},
        method: {},
        query: {}
      });

      return handler
        .getClient(request)
        .then(function () {
          expect(model.getClient.callCount).to.equal(1);
          expect(model.getClient.firstCall.args).to.have.length(2);
          expect(model.getClient.firstCall.args[0]).to.equal(12345);
          expect(model.getClient.firstCall.thisValue).to.equal(model);

          expect(model.validateRedirectUri.callCount).to.equal(1);
          expect(model.validateRedirectUri.firstCall.args).to.deep.equal([
            redirect_uri,
            client
          ]);
          expect(model.validateRedirectUri.firstCall.thisValue).to.equal(model);
        })
        .catch(expect.fail);
    });

    it('validates', function () {
      const client = {
        grants: ['authorization_code'],
        redirectUris: ['http://example.com/cb']
      };
      const redirect_uri = 'http://example.com/cb';
      const model = {
        getAccessToken: function () {},
        getClient: sinon.stub().returns(client),
        saveAuthorizationCode: function () {},
        validateRedirectUri: function (redirectUri, client) {
          return client.redirectUris.includes(redirectUri);
        }
      };

      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model: model
      });
      const request = new Request({
        body: { client_id: 12345, client_secret: 'secret', redirect_uri },
        headers: {},
        method: {},
        query: {}
      });

      return handler.getClient(request).then((client) => {
        expect(client).to.equal(client);
      });
    });

    it('does not validate', function () {
      const client = {
        grants: ['authorization_code'],
        redirectUris: ['http://example.com/cb']
      };
      const redirect_uri = 'http://example.com/callback';
      const model = {
        getAccessToken: function () {},
        getClient: sinon.stub().returns(client),
        saveAuthorizationCode: function () {},
        validateRedirectUri: function (redirectUri, client) {
          return client.redirectUris.includes(redirectUri);
        }
      };

      const handler = new AuthorizeHandler({
        authorizationCodeLifetime: 120,
        model: model
      });
      const request = new Request({
        body: { client_id: 12345, client_secret: 'secret', redirect_uri },
        headers: {},
        method: {},
        query: {}
      });

      return handler
        .getClient(request)
        .then(() => {
          throw Error('must not resolve');
        })
        .catch((err) => {
          expect(err).to.deep.include({
            name: 'invalid_client',
            message:
              'Invalid client: `redirect_uri` does not match client value'
          });
        });
    });
  });
});
