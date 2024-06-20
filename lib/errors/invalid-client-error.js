'use strict';

/**
 * Module dependencies.
 */

import OAuthError from './oauth-error.js';

/**
 * Constructor.
 *
 * "Client authentication failed (e.g., unknown client, no client
 * authentication included, or unsupported authentication method)"
 *
 * @see https://tools.ietf.org/html/rfc6749#section-5.2
 */

export default class InvalidClientError extends OAuthError {
  constructor(message, properties) {
    properties = {
      code: 400,
      name: 'invalid_client',
      ...properties
    };

    super(message, properties);
  }
}
