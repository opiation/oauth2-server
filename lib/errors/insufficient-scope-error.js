'use strict';

/**
 * Module dependencies.
 */

import OAuthError from './oauth-error.js';

/**
 * Constructor.
 *
 * "The request requires higher privileges than provided by the access token.."
 *
 * @see https://tools.ietf.org/html/rfc6750.html#section-3.1
 */

export default class InsufficientScopeError extends OAuthError {
  constructor(message, properties) {
    properties = {
      code: 403,
      name: 'insufficient_scope',
      ...properties
    };

    super(message, properties);
  }
}
