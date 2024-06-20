'use strict';

/**
 * Module dependencies.
 */

import OAuthError from './oauth-error.js';

/**
 * Constructor.
 *
 * "The authorization server encountered an unexpected condition that prevented it from fulfilling the request."
 *
 * @see https://tools.ietf.org/html/rfc6749#section-4.1.2.1
 */

export default class ServerError extends OAuthError {
  constructor(message, properties) {
    properties = {
      code: 503,
      name: 'server_error',
      ...properties
    };

    super(message, properties);
  }
}
