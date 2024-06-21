'use strict';

/**
 * Module dependencies.
 */

import BearerTokenType from '../../../lib/token-types/bearer-token-type.js';
import InvalidArgumentError from '../../../lib/errors/invalid-argument-error.js';
import { describe, expect, it } from '../../test-utils.js';

/**
 * Test `BearerTokenType` integration.
 */

describe('BearerTokenType integration', function () {
  describe('constructor()', function () {
    it('throws an error if `accessToken` is missing', function () {
      try {
        new BearerTokenType();

        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceOf(InvalidArgumentError);
        expect(e.message).to.equal('Missing parameter: `accessToken`');
      }
    });

    it('sets the `accessToken`', function () {
      const responseType = new BearerTokenType('foo', 'bar');

      expect(responseType.accessToken).to.equal('foo');
    });

    it('sets the `accessTokenLifetime`', function () {
      const responseType = new BearerTokenType('foo', 'bar');

      expect(responseType.accessTokenLifetime).to.equal('bar');
    });

    it('sets the `refreshToken`', function () {
      const responseType = new BearerTokenType('foo', 'bar', 'biz');

      expect(responseType.refreshToken).to.equal('biz');
    });
  });

  describe('valueOf()', function () {
    it('returns the value representation', function () {
      const responseType = new BearerTokenType('foo', 'bar');

      expect(responseType.valueOf()).to.eql({
        access_token: 'foo',
        expires_in: 'bar',
        token_type: 'Bearer'
      });
    });

    it('excludes the `expires_in` if not given', function () {
      const responseType = new BearerTokenType('foo');

      expect(responseType.valueOf()).to.eql({
        access_token: 'foo',
        token_type: 'Bearer'
      });
    });

    it('sets `refresh_token` if `refreshToken` is defined', function () {
      const responseType = new BearerTokenType('foo', 'bar', 'biz');

      expect(responseType.valueOf()).to.eql({
        access_token: 'foo',
        expires_in: 'bar',
        refresh_token: 'biz',
        token_type: 'Bearer'
      });
    });

    it('sets `expires_in` if `accessTokenLifetime` is defined', function () {
      const responseType = new BearerTokenType('foo', 'bar', 'biz');

      expect(responseType.valueOf()).to.eql({
        access_token: 'foo',
        expires_in: 'bar',
        refresh_token: 'biz',
        token_type: 'Bearer'
      });
    });
  });
});
