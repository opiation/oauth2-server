'use strict';

/**
 * Module dependencies.
 */

import OAuthError from '../../../lib/errors/oauth-error.js';
import { describe, expect, it } from '../../test-utils.js';

/**
 * Test `OAuthError`.
 */

describe('OAuthError', function () {
  describe('constructor()', function () {
    it('gets `captureStackTrace`', function () {
      const errorFn = function () {
        throw new OAuthError('test', { name: 'test_error', foo: 'bar' });
      };

      try {
        errorFn();

        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceOf(OAuthError);
        expect(e.name).to.equal('test_error');
        expect(e.foo).to.equal('bar');
        expect(e.message).to.equal('test');
        expect(e.code).to.equal(500);
        expect(e.stack).to.not.be.null;
        expect(e.stack).to.not.be.undefined;
        expect(e.stack).to.include('oauth-error_test.js');
        expect(e.stack).to.include('18'); //error lineNUmber
      }
    });
  });

  it('supports undefined properties', function () {
    const errorFn = function () {
      throw new OAuthError('test');
    };

    try {
      errorFn();

      expect.fail();
    } catch (e) {
      expect(e).to.be.an.instanceOf(OAuthError);
      expect(e.name).to.equal('Error');
      expect(e.message).to.equal('test');
      expect(e.code).to.equal(500);
      expect(e.stack).to.not.be.null;
      expect(e.stack).to.not.be.undefined;
      expect(e.stack).to.include('oauth-error_test.js');
      expect(e.stack).to.include('41'); //error lineNUmber
    }
  });
});
