'use strict';

/**
 * Module dependencies.
 */

import OAuthError from './oauth-error.js';

/**
 * Constructor.
 *
 * "The authenticated client is not authorized to use this authorization grant type."
 *
 * @see https://tools.ietf.org/html/rfc6749#section-4.1.2.1
 */

export default class UnauthorizedClientError extends OAuthError {
  constructor(message, properties) {
    properties = {
      code: 400,
      name: 'unauthorized_client',
      ...properties
    };

    super(message, properties);
  }
}
