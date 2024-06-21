'use strict';

/**
 * Module dependencies.
 */

import Response from '../../lib/response.js';
import { describe, expect, it } from '../test-utils.js';

/**
 * Test `Request`.
 */

function generateBaseResponse() {
  return {
    headers: {
      bar: 'foo'
    },
    body: {
      foobar: 'barfoo'
    }
  };
}

describe('Request', function () {
  it('instantiates with a basic request', function () {
    const originalResponse = generateBaseResponse();

    const response = new Response(originalResponse);
    expect(response.headers).to.eql(originalResponse.headers);
    expect(response.body).to.eql(originalResponse.body);
    expect(response.status).to.eql(200);
  });

  it('allows a response to be passed without a body', function () {
    const originalResponse = generateBaseResponse();
    delete originalResponse.body;

    const response = new Response(originalResponse);
    expect(response.headers).to.eql(originalResponse.headers);
    expect(response.body).to.eql({});
    expect(response.status).to.eql(200);
  });

  it('allows a response to be passed without headers', function () {
    const originalResponse = generateBaseResponse();
    delete originalResponse.headers;

    const response = new Response(originalResponse);
    expect(response.headers).to.eql({});
    expect(response.body).to.eql(originalResponse.body);
    expect(response.status).to.eql(200);
  });

  it('converts all header keys to lowercase', function () {
    const originalResponse = generateBaseResponse();
    originalResponse.headers = {
      Foo: 'bar',
      BAR: 'foo'
    };

    const response = new Response(originalResponse);
    expect(response.headers.foo).to.eql('bar');
    expect(response.headers.bar).to.eql('foo');
    expect(response.headers.Foo).not.to.exist;
    expect(response.headers.BAR).not.to.exist;
  });

  it('includes additional properties passed in the response', function () {
    const originalResponse = generateBaseResponse();
    originalResponse.custom = {
      newFoo: 'newBar'
    };

    originalResponse.custom2 = {
      newBar: 'newFoo'
    };

    const response = new Response(originalResponse);
    expect(response.headers).to.eql(originalResponse.headers);
    expect(response.body).to.eql(originalResponse.body);
    expect(response.custom).to.eql(originalResponse.custom);
    expect(response.custom2).to.eql(originalResponse.custom2);
  });

  it('does not allow overwriting methods on the Response prototype via custom properties', () => {
    const response = new Response({
      headers: {
        'content-type': 'application/json'
      },
      get() {
        // malicious attempt to override the 'get' method
        return 'text/html';
      }
    });

    expect(response.get('content-type')).to.equal('application/json');
  });

  it('allows getting of headers using `response.get`', function () {
    const originalResponse = generateBaseResponse();

    const response = new Response(originalResponse);
    expect(response.get('bar')).to.eql(originalResponse.headers.bar);
  });

  it('allow getting of headers using `response.get`', function () {
    const originalResponse = generateBaseResponse();

    const response = new Response(originalResponse);
    expect(response.get('bar')).to.eql(originalResponse.headers.bar);
  });

  it('allows setting of headers using `response.set`', function () {
    const originalResponse = generateBaseResponse();

    const response = new Response(originalResponse);
    expect(response.headers).to.eql(originalResponse.headers);
    response.set('newheader', 'newvalue');
    expect(response.headers.bar).to.eql('foo');
    expect(response.headers.newheader).to.eql('newvalue');
  });

  it('processs redirect', function () {
    const originalResponse = generateBaseResponse();

    const response = new Response(originalResponse);
    expect(response.headers).to.eql(originalResponse.headers);
    expect(response.status).to.eql(200);
    response.redirect('http://foo.bar');
    expect(response.headers.location).to.eql('http://foo.bar');
    expect(response.status).to.eql(302);
  });
});
