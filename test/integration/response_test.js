'use strict';

/**
 * Module dependencies.
 */

import Response from '../../lib/response.js';

/**
 * Test `Response` integration.
 */

describe('Response integration', function () {
  describe('constructor()', function () {
    it('should set the `body`', function () {
      const response = new Response({ body: 'foo', headers: {} });

      response.body.should.equal('foo');
    });

    it('should set the `headers`', function () {
      const response = new Response({
        body: {},
        headers: { foo: 'bar', QuX: 'biz' },
      });

      response.headers.should.eql({ foo: 'bar', qux: 'biz' });
    });

    it('should set the `status` to 200', function () {
      const response = new Response({ body: {}, headers: {} });

      response.status.should.equal(200);
    });
  });

  describe('get()', function () {
    it('should return `undefined` if the field does not exist', function () {
      const response = new Response({ body: {}, headers: {} });

      (undefined === response.get('content-type')).should.be.true;
    });

    it('should return the value if the field exists', function () {
      const response = new Response({
        body: {},
        headers: { 'content-type': 'text/html; charset=utf-8' },
      });

      response.get('Content-Type').should.equal('text/html; charset=utf-8');
    });
  });

  describe('redirect()', function () {
    it('should set the location header to `url`', function () {
      const response = new Response({ body: {}, headers: {} });

      response.redirect('http://example.com');

      response.get('Location').should.equal('http://example.com');
    });

    it('should set the `status` to 302', function () {
      const response = new Response({ body: {}, headers: {} });

      response.redirect('http://example.com');

      response.status.should.equal(302);
    });
  });

  describe('set()', function () {
    it('should set the `field`', function () {
      const response = new Response({ body: {}, headers: {} });

      response.set('foo', 'bar');

      response.headers.should.eql({ foo: 'bar' });
    });
  });
});
