'use strict';

/**
 * Module dependencies.
 */

import AbstractGrantType from '../../../lib/grant-types/abstract-grant-type.js';
import { describe, expect, it, sinon } from '../../test-utils.js';

/**
 * Test `AbstractGrantType`.
 */

describe('AbstractGrantType', function () {
  describe('generateAccessToken()', function () {
    it('calls `model.generateAccessToken()`', function () {
      const model = {
        generateAccessToken: sinon
          .stub()
          .returns({ client: {}, expiresAt: new Date(), user: {} })
      };
      const handler = new AbstractGrantType({
        accessTokenLifetime: 120,
        model: model
      });

      return handler
        .generateAccessToken()
        .then(function () {
          expect(model.generateAccessToken.callCount).to.equal(1);
          expect(model.generateAccessToken.firstCall.thisValue).to.equal(model);
        })
        .catch(expect.fail);
    });
  });

  describe('generateRefreshToken()', function () {
    it('calls `model.generateRefreshToken()`', function () {
      const model = {
        generateRefreshToken: sinon.stub().returns({
          client: {},
          expiresAt: new Date(new Date() / 2),
          user: {}
        })
      };
      const handler = new AbstractGrantType({
        accessTokenLifetime: 120,
        model: model
      });

      return handler
        .generateRefreshToken()
        .then(function () {
          expect(model.generateRefreshToken.callCount).to.equal(1);
          expect(model.generateRefreshToken.firstCall.thisValue).to.equal(
            model
          );
        })
        .catch(expect.fail);
    });
  });
});
