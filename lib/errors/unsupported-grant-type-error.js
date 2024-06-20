'use strict';

/**
 * Module dependencies.
 */

import OAuthError from './oauth-error.js';

/**
 * Constructor.
 *
 * "The authorization grant type is not supported by the authorization server."
 *
 * @see https://tools.ietf.org/html/rfc6749#section-4.1.2.1
 */

export default class UnsupportedGrantTypeError extends OAuthError {
  constructor(message, properties) {
    properties = {
      code: 400,
      name: 'unsupported_grant_type',
      ...properties
    };

    super(message, properties);
  }
}
