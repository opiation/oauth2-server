'use strict';

/**
 * Module dependencies.
 */

import Request from '../../lib/request.js';
import InvalidArgumentError from '../../lib/errors/invalid-argument-error.js';
import { describe, expect, it } from '../test-utils.js';

/**
 * Test `Request`.
 */

function generateBaseRequest() {
  return {
    query: {
      foo: 'bar'
    },
    method: 'GET',
    headers: {
      bar: 'foo'
    },
    body: {
      foobar: 'barfoo'
    }
  };
}

describe('Request', function () {
  it('throws on missing args', function () {
    const args = [
      [undefined, InvalidArgumentError, 'Missing parameter: `headers`'],
      // prettier-ignore
      [null, TypeError, 'Cannot destructure property \'headers\''],
      [{}, InvalidArgumentError, 'Missing parameter: `headers`'],
      [{ headers: {} }, InvalidArgumentError, 'Missing parameter: `method`'],
      [
        { headers: {}, method: 'GET' },
        InvalidArgumentError,
        'Missing parameter: `query`'
      ]
    ];

    args.forEach(([value, error, message]) => {
      try {
        new Request(value);
      } catch (e) {
        expect(e)
          .to.be.instanceOf(error)
          .and.have.property('message')
          .that.includes(message);
      }
    });
  });
  it('instantiates with a basic request', function () {
    const originalRequest = generateBaseRequest();

    const request = new Request(originalRequest);
    expect(request.body).to.eql(originalRequest.body);
    expect(request.headers).to.eql(originalRequest.headers);
    expect(request.method).to.eql(originalRequest.method);
    expect(request.query).to.eql(originalRequest.query);
  });

  it('allows a request to be passed without a body', function () {
    const originalRequest = generateBaseRequest();
    delete originalRequest.body;

    const request = new Request(originalRequest);
    expect(request.body).to.eql({});
    expect(request.headers).to.eql(originalRequest.headers);
    expect(request.method).to.eql(originalRequest.method);
    expect(request.query).to.eql(originalRequest.query);
  });

  it('throws if headers are not passed to the constructor', function () {
    const originalRequest = generateBaseRequest();
    delete originalRequest.headers;

    expect(function () {
      new Request(originalRequest);
    }).to.throw('Missing parameter: `headers`');
  });

  // prettier-ignore
  it('throws if query string isn\'t passed to the constructor', function () {
    const originalRequest = generateBaseRequest();
    delete originalRequest.query;

    expect(function () {
      new Request(originalRequest);
    }).to.throw('Missing parameter: `query`');
  });

  // prettier-ignore
  it('throws if method isn\'t passed to the constructor', function () {
    const originalRequest = generateBaseRequest();
    delete originalRequest.method;

    expect(function () {
      new Request(originalRequest);
    }).to.throw('Missing parameter: `method`');
  });

  it('converts all header keys to lowercase', function () {
    const originalRequest = generateBaseRequest();
    originalRequest.headers = {
      Foo: 'bar',
      BAR: 'foo'
    };

    const request = new Request(originalRequest);
    expect(request.headers.foo).to.eql('bar');
    expect(request.headers.bar).to.eql('foo');
    expect(request.headers.Foo).to.not.exist;
    expect(request.headers.BAR).to.not.exist;
  });

  it('includes additional properties passed in the request', function () {
    const originalRequest = generateBaseRequest();
    originalRequest.custom = {
      newFoo: 'newBar'
    };

    originalRequest.custom2 = {
      newBar: 'newFoo'
    };

    const request = new Request(originalRequest);
    expect(request.headers).to.eql(originalRequest.headers);
    expect(request.method).to.eql(originalRequest.method);
    expect(request.query).to.eql(originalRequest.query);
    expect(request.body).to.eql(originalRequest.body);
    expect(request.custom).to.eql(originalRequest.custom);
    expect(request.custom2).to.eql(originalRequest.custom2);
  });

  it('includes additional properties passed in the request', function () {
    const originalRequest = generateBaseRequest();
    originalRequest.custom = {
      newFoo: 'newBar'
    };

    originalRequest.custom2 = {
      newBar: 'newFoo'
    };

    const request = new Request(originalRequest);
    expect(request.headers).to.eql(originalRequest.headers);
    expect(request.method).to.eql(originalRequest.method);
    expect(request.query).to.eql(originalRequest.query);
    expect(request.body).to.eql(originalRequest.body);
    expect(request.custom).to.eql(originalRequest.custom);
    expect(request.custom2).to.eql(originalRequest.custom2);
  });

  it('does not allow overwriting methods on the Request prototype via custom properties', () => {
    const request = new Request({
      query: {},
      method: 'GET',
      headers: {
        'content-type': 'application/json'
      },
      get() {
        // malicious attempt to override the 'get' method
        return 'text/html';
      }
    });

    expect(request.get('content-type')).to.equal('application/json');
  });

  it('allows getting of headers using `request.get`', function () {
    const originalRequest = generateBaseRequest();

    const request = new Request(originalRequest);
    expect(request.get('bar')).to.eql(originalRequest.headers.bar);
  });

  it('allows getting of headers using `request.get`', function () {
    const originalRequest = generateBaseRequest();

    const request = new Request(originalRequest);
    expect(request.get('bar')).to.eql(originalRequest.headers.bar);
  });

  it('allows getting of headers using `request.get`', function () {
    const originalRequest = generateBaseRequest();

    const request = new Request(originalRequest);
    expect(request.get('bar')).to.eql(originalRequest.headers.bar);
  });

  it('validates the content-type', function () {
    const originalRequest = generateBaseRequest();
    originalRequest.headers['content-type'] =
      'application/x-www-form-urlencoded';
    originalRequest.headers['content-length'] = JSON.stringify(
      originalRequest.body
    ).length;

    const request = new Request(originalRequest);
    expect(request.is('application/x-www-form-urlencoded')).to.eql(
      'application/x-www-form-urlencoded'
    );
  });

  it('returns false if the content-type is invalid', function () {
    const originalRequest = generateBaseRequest();
    originalRequest.headers['content-type'] =
      'application/x-www-form-urlencoded';
    originalRequest.headers['content-length'] = JSON.stringify(
      originalRequest.body
    ).length;

    const request = new Request(originalRequest);
    expect(request.is('application/json')).to.be.false;
  });
});
