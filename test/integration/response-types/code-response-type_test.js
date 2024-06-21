'use strict';

/**
 * Module dependencies.
 */

import url from 'node:url';
import CodeResponseType from '../../../lib/response-types/code-response-type.js';
import InvalidArgumentError from '../../../lib/errors/invalid-argument-error.js';
import { describe, expect, it } from '../../test-utils.js';

/**
 * Test `CodeResponseType` integration.
 */

describe('CodeResponseType integration', function () {
  describe('constructor()', function () {
    it('throws an error if `code` is missing', function () {
      try {
        new CodeResponseType();

        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceOf(InvalidArgumentError);
        expect(e.message).to.equal('Missing parameter: `code`');
      }
    });

    it('sets the `code`', function () {
      const responseType = new CodeResponseType('foo');

      expect(responseType.code).to.equal('foo');
    });
  });

  describe('buildRedirectUri()', function () {
    it('throws an error if the `redirectUri` is missing', function () {
      const responseType = new CodeResponseType('foo');

      try {
        responseType.buildRedirectUri();

        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceOf(InvalidArgumentError);
        expect(e.message).to.equal('Missing parameter: `redirectUri`');
      }
    });

    it('returns the new redirect uri and set the `code` and `state` in the query', function () {
      const responseType = new CodeResponseType('foo');
      const redirectUri = responseType.buildRedirectUri(
        'http://example.com/cb'
      );

      expect(url.format(redirectUri)).to.equal(
        'http://example.com/cb?code=foo'
      );
    });

    it('returns the new redirect uri and append the `code` and `state` in the query', function () {
      const responseType = new CodeResponseType('foo');
      const redirectUri = responseType.buildRedirectUri(
        'http://example.com/cb?foo=bar'
      );

      expect(url.format(redirectUri)).to.equal(
        'http://example.com/cb?foo=bar&code=foo'
      );
    });
  });
});
