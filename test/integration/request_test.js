'use strict';

/**
 * Module dependencies.
 */

import Request from '../../lib/request.js';
import InvalidArgumentError from '../../lib/errors/invalid-argument-error.js';
import { describe, expect, it } from '../test-utils.js';

/**
 * Test `Request` integration.
 */

describe('Request integration', function () {
  describe('constructor()', function () {
    it('throws an error if `headers` is missing', function () {
      try {
        new Request({ body: {} });

        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceOf(InvalidArgumentError);
        expect(e.message).to.equal('Missing parameter: `headers`');
      }
    });

    it('throws an error if `method` is missing', function () {
      try {
        new Request({ body: {}, headers: {} });

        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceOf(InvalidArgumentError);
        expect(e.message).to.equal('Missing parameter: `method`');
      }
    });

    it('throws an error if `query` is missing', function () {
      try {
        new Request({ body: {}, headers: {}, method: {} });

        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceOf(InvalidArgumentError);
        expect(e.message).to.equal('Missing parameter: `query`');
      }
    });

    it('sets the `body`', function () {
      const request = new Request({
        body: 'foo',
        headers: {},
        method: {},
        query: {}
      });

      expect(request.body).to.equal('foo');
    });

    it('sets the `headers`', function () {
      const request = new Request({
        body: {},
        headers: { foo: 'bar', QuX: 'biz' },
        method: {},
        query: {}
      });

      expect(request.headers).to.eql({ foo: 'bar', qux: 'biz' });
    });

    it('sets the `method`', function () {
      const request = new Request({
        body: {},
        headers: {},
        method: 'biz',
        query: {}
      });

      expect(request.method).to.equal('biz');
    });

    it('sets the `query`', function () {
      const request = new Request({
        body: {},
        headers: {},
        method: {},
        query: 'baz'
      });

      expect(request.query).to.equal('baz');
    });
  });

  describe('get()', function () {
    it('returns `undefined` if the field does not exist', function () {
      const request = new Request({
        body: {},
        headers: {},
        method: {},
        query: {}
      });

      expect(request.get('content-type')).to.be.undefined;
    });

    it('returns the value if the field exists', function () {
      const request = new Request({
        body: {},
        headers: {
          'content-type': 'text/html; charset=utf-8'
        },
        method: {},
        query: {}
      });

      expect(request.get('Content-Type')).to.equal('text/html; charset=utf-8');
    });
  });

  describe('is()', function () {
    it('accepts an array of `types`', function () {
      const request = new Request({
        body: {},
        headers: {
          'content-type': 'application/json',
          'transfer-encoding': 'chunked'
        },
        method: {},
        query: {}
      });

      expect(request.is(['html', 'json'])).to.equal('json');
    });

    it('accepts multiple `types` as arguments', function () {
      const request = new Request({
        body: {},
        headers: {
          'content-type': 'application/json',
          'transfer-encoding': 'chunked'
        },
        method: {},
        query: {}
      });

      expect(request.is('html', 'json')).to.equal('json');
    });

    it('returns the first matching type', function () {
      const request = new Request({
        body: {},
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'transfer-encoding': 'chunked'
        },
        method: {},
        query: {}
      });

      expect(request.is('html')).to.equal('html');
    });

    it('returns `false` if none of the `types` match', function () {
      const request = new Request({
        body: {},
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'transfer-encoding': 'chunked'
        },
        method: {},
        query: {}
      });

      expect(request.is('json')).to.be.false;
    });

    it('returns `false` if the request has no body', function () {
      const request = new Request({
        body: {},
        headers: {},
        method: {},
        query: {}
      });

      expect(request.is('text/html')).to.be.false;
    });
  });
});
