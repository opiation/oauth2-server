'use strict';

/**
 * Module dependencies.
 */

import OAuthError from './oauth-error.js';

/**
 * Constructor.
 *
 * "If the request lacks any authentication information (e.g., the client
 * was unaware that authentication is necessary or attempted using an
 * unsupported authentication method), the resource server SHOULD NOT
 * include an error code or other error information."
 *
 * @see https://tools.ietf.org/html/rfc6750#section-3.1
 */

export default class UnauthorizedRequestError extends OAuthError {
  constructor(message, properties) {
    properties = {
      code: 401,
      name: 'unauthorized_request',
      ...properties
    };

    super(message, properties);
  }
}
