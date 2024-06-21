'use strict';

/**
 * Module dependencies.
 */

import Response from '../../lib/response.js';
import { describe, expect, it } from '../test-utils.js';

/**
 * Test `Response` integration.
 */

describe('Response integration', function () {
  describe('constructor()', function () {
    it('sets the `body`', function () {
      const response = new Response({ body: 'foo', headers: {} });

      expect(response.body).to.equal('foo');
    });

    it('sets the `headers`', function () {
      const response = new Response({
        body: {},
        headers: { foo: 'bar', QuX: 'biz' }
      });

      expect(response.headers).to.eql({ foo: 'bar', qux: 'biz' });
    });

    it('sets the `status` to 200', function () {
      const response = new Response({ body: {}, headers: {} });

      expect(response.status).to.equal(200);
    });
  });

  describe('get()', function () {
    it('returns `undefined` if the field does not exist', function () {
      const response = new Response({ body: {}, headers: {} });

      expect(response.get('content-type')).to.be.undefined;
    });

    it('returns the value if the field exists', function () {
      const response = new Response({
        body: {},
        headers: { 'content-type': 'text/html; charset=utf-8' }
      });

      expect(response.get('Content-Type')).to.equal('text/html; charset=utf-8');
    });
  });

  describe('redirect()', function () {
    it('sets the location header to `url`', function () {
      const response = new Response({ body: {}, headers: {} });

      response.redirect('http://example.com');

      expect(response.get('Location')).to.equal('http://example.com');
    });

    it('sets the `status` to 302', function () {
      const response = new Response({ body: {}, headers: {} });

      response.redirect('http://example.com');

      expect(response.status).to.equal(302);
    });
  });

  describe('set()', function () {
    it('sets the `field`', function () {
      const response = new Response({ body: {}, headers: {} });

      response.set('foo', 'bar');

      expect(response.headers).to.eql({ foo: 'bar' });
    });
  });
});
