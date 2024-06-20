'use strict';

/**
 * Module dependencies.
 */

import OAuthError from './oauth-error.js';

/**
 * Constructor.
 *
 * "The authorization server does not supported obtaining an
 * authorization code using this method."
 *
 * @see https://tools.ietf.org/html/rfc6749#section-4.1.2.1
 */

export default class UnsupportedResponseTypeError extends OAuthError {
  constructor(message, properties) {
    properties = {
      code: 400,
      name: 'unsupported_response_type',
      ...properties
    };

    super(message, properties);
  }
}
