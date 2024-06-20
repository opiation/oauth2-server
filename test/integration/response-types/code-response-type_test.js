'use strict';

/**
 * Module dependencies.
 */

import CodeResponseType from '../../../lib/response-types/code-response-type.js';
import InvalidArgumentError from '../../../lib/errors/invalid-argument-error.js';
import Chai from 'chai';
const should = Chai.should();
import url from 'node:url';

/**
 * Test `CodeResponseType` integration.
 */

describe('CodeResponseType integration', function () {
  describe('constructor()', function () {
    it('should throw an error if `code` is missing', function () {
      try {
        new CodeResponseType();

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `code`');
      }
    });

    it('should set the `code`', function () {
      const responseType = new CodeResponseType('foo');

      responseType.code.should.equal('foo');
    });
  });

  describe('buildRedirectUri()', function () {
    it('should throw an error if the `redirectUri` is missing', function () {
      const responseType = new CodeResponseType('foo');

      try {
        responseType.buildRedirectUri();

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `redirectUri`');
      }
    });

    it('should return the new redirect uri and set the `code` and `state` in the query', function () {
      const responseType = new CodeResponseType('foo');
      const redirectUri = responseType.buildRedirectUri(
        'http://example.com/cb'
      );

      url.format(redirectUri).should.equal('http://example.com/cb?code=foo');
    });

    it('should return the new redirect uri and append the `code` and `state` in the query', function () {
      const responseType = new CodeResponseType('foo');
      const redirectUri = responseType.buildRedirectUri(
        'http://example.com/cb?foo=bar'
      );

      url
        .format(redirectUri)
        .should.equal('http://example.com/cb?foo=bar&code=foo');
    });
  });
});
