'use strict';

/**
 * Module dependencies.
 */

import OAuthError from './oauth-error.js';

/**
 * Constructor.
 *
 * "The requested scope is invalid, unknown, or malformed."
 *
 * @see https://tools.ietf.org/html/rfc6749#section-4.1.2.1
 */

export default class InvalidScopeError extends OAuthError {
  constructor(message, properties) {
    properties = {
      code: 400,
      name: 'invalid_scope',
      ...properties
    };

    super(message, properties);
  }
}
