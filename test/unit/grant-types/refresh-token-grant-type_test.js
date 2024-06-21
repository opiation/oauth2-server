'use strict';

/**
 * Module dependencies.
 */

import RefreshTokenGrantType from '../../../lib/grant-types/refresh-token-grant-type.js';
import Request from '../../../lib/request.js';
import { describe, expect, it, sinon } from '../../test-utils.js';

/**
 * Test `RefreshTokenGrantType`.
 */

describe('RefreshTokenGrantType', function () {
  describe('handle()', function () {
    it('revokes the previous token', function () {
      const token = { accessToken: 'foo', client: {}, user: {} };
      const model = {
        getRefreshToken: function () {
          return token;
        },
        saveToken: function () {
          return { accessToken: 'bar', client: {}, user: {} };
        },
        revokeToken: sinon.stub().returns({
          accessToken: 'foo',
          client: {},
          refreshTokenExpiresAt: new Date(new Date() / 2),
          user: {}
        })
      };
      const handler = new RefreshTokenGrantType({
        accessTokenLifetime: 120,
        model: model
      });
      const request = new Request({
        body: { refresh_token: 'bar' },
        headers: {},
        method: {},
        query: {}
      });
      const client = {};

      return handler
        .handle(request, client)
        .then(function () {
          expect(model.revokeToken.callCount).to.equal(1);
          expect(model.revokeToken.firstCall).to.deep.include({
            args: [token],
            thisValue: model
          });
        })
        .catch(expect.fail);
    });
  });

  describe('getRefreshToken()', function () {
    it('calls `model.getRefreshToken()`', function () {
      const model = {
        getRefreshToken: sinon
          .stub()
          .returns({ accessToken: 'foo', client: {}, user: {} }),
        saveToken: function () {},
        revokeToken: function () {}
      };
      const handler = new RefreshTokenGrantType({
        accessTokenLifetime: 120,
        model: model
      });
      const request = new Request({
        body: { refresh_token: 'bar' },
        headers: {},
        method: {},
        query: {}
      });
      const client = {};

      return handler
        .getRefreshToken(request, client)
        .then(function () {
          expect(model.getRefreshToken.callCount).to.equal(1);
          expect(model.getRefreshToken.firstCall).to.deep.include({
            args: ['bar'],
            thisValue: model
          });
        })
        .catch(expect.fail);
    });
  });

  describe('revokeToken()', function () {
    it('calls `model.revokeToken()`', function () {
      const model = {
        getRefreshToken: function () {},
        revokeToken: sinon.stub().returns({
          accessToken: 'foo',
          client: {},
          refreshTokenExpiresAt: new Date(new Date() / 2),
          user: {}
        }),
        saveToken: function () {}
      };
      const handler = new RefreshTokenGrantType({
        accessTokenLifetime: 120,
        model: model
      });
      const token = {};

      return handler
        .revokeToken(token)
        .then(function () {
          expect(model.revokeToken.callCount).to.equal(1);
          expect(model.revokeToken.firstCall).to.deep.include({
            args: [token],
            thisValue: model
          });
        })
        .catch(expect.fail);
    });

    it('does not call `model.revokeToken()`', function () {
      const model = {
        getRefreshToken: function () {},
        revokeToken: sinon.stub().returns({
          accessToken: 'foo',
          client: {},
          refreshTokenExpiresAt: new Date(new Date() / 2),
          user: {}
        }),
        saveToken: function () {}
      };
      const handler = new RefreshTokenGrantType({
        accessTokenLifetime: 120,
        model: model,
        alwaysIssueNewRefreshToken: false
      });
      const token = {};

      return handler
        .revokeToken(token)
        .then(function () {
          expect(model.revokeToken.callCount).to.equal(0);
        })
        .catch(expect.fail);
    });

    it('does not call `model.revokeToken()`', function () {
      const model = {
        getRefreshToken: function () {},
        revokeToken: sinon.stub().returns({
          accessToken: 'foo',
          client: {},
          refreshTokenExpiresAt: new Date(new Date() / 2),
          user: {}
        }),
        saveToken: function () {}
      };
      const handler = new RefreshTokenGrantType({
        accessTokenLifetime: 120,
        model: model,
        alwaysIssueNewRefreshToken: true
      });
      const token = {};

      return handler
        .revokeToken(token)
        .then(function () {
          expect(model.revokeToken.callCount).to.equal(1);
          expect(model.revokeToken.firstCall).to.deep.include({
            args: [token],
            thisValue: model
          });
        })
        .catch(expect.fail);
    });
  });

  describe('saveToken()', function () {
    it('calls `model.saveToken()`', function () {
      const client = {};
      const user = {};
      const model = {
        getRefreshToken: function () {},
        revokeToken: function () {},
        saveToken: sinon.stub().returns(true)
      };
      const handler = new RefreshTokenGrantType({
        accessTokenLifetime: 120,
        model: model
      });

      sinon.stub(handler, 'generateAccessToken').returns('foo');
      sinon.stub(handler, 'generateRefreshToken').returns('bar');
      sinon.stub(handler, 'getAccessTokenExpiresAt').returns('biz');
      sinon.stub(handler, 'getRefreshTokenExpiresAt').returns('baz');

      return handler
        .saveToken(user, client, ['foobar'])
        .then(function () {
          expect(model.saveToken.callCount).to.equal(1);
          expect(model.saveToken.firstCall).to.deep.include({
            args: [
              {
                accessToken: 'foo',
                accessTokenExpiresAt: 'biz',
                refreshToken: 'bar',
                refreshTokenExpiresAt: 'baz',
                scope: ['foobar']
              },
              client,
              user
            ],
            thisValue: model
          });
        })
        .catch(expect.fail);
    });

    it('calls `model.saveToken()` without refresh token', function () {
      const client = {};
      const user = {};
      const model = {
        getRefreshToken: function () {},
        revokeToken: function () {},
        saveToken: sinon.stub().returns(true)
      };
      const handler = new RefreshTokenGrantType({
        accessTokenLifetime: 120,
        model: model,
        alwaysIssueNewRefreshToken: false
      });

      sinon.stub(handler, 'generateAccessToken').returns('foo');
      sinon.stub(handler, 'generateRefreshToken').returns('bar');
      sinon.stub(handler, 'getAccessTokenExpiresAt').returns('biz');
      sinon.stub(handler, 'getRefreshTokenExpiresAt').returns('baz');

      return handler
        .saveToken(user, client, ['foobar'])
        .then(function () {
          expect(model.saveToken.callCount).to.equal(1);
          expect(model.saveToken.firstCall).to.deep.include({
            args: [
              {
                accessToken: 'foo',
                accessTokenExpiresAt: 'biz',
                scope: ['foobar']
              },
              client,
              user
            ],
            thisValue: model
          });
        })
        .catch(expect.fail);
    });

    it('calls `model.saveToken()` with refresh token', function () {
      const client = {};
      const user = {};
      const model = {
        getRefreshToken: function () {},
        revokeToken: function () {},
        saveToken: sinon.stub().returns(true)
      };
      const handler = new RefreshTokenGrantType({
        accessTokenLifetime: 120,
        model: model,
        alwaysIssueNewRefreshToken: true
      });

      sinon.stub(handler, 'generateAccessToken').returns('foo');
      sinon.stub(handler, 'generateRefreshToken').returns('bar');
      sinon.stub(handler, 'getAccessTokenExpiresAt').returns('biz');
      sinon.stub(handler, 'getRefreshTokenExpiresAt').returns('baz');

      return handler
        .saveToken(user, client, ['foobar'])
        .then(function () {
          expect(model.saveToken.callCount).to.equal(1);
          expect(model.saveToken.firstCall).to.deep.include({
            args: [
              {
                accessToken: 'foo',
                accessTokenExpiresAt: 'biz',
                refreshToken: 'bar',
                refreshTokenExpiresAt: 'baz',
                scope: ['foobar']
              },
              client,
              user
            ],
            thisValue: model
          });
        })
        .catch(expect.fail);
    });
  });
});
