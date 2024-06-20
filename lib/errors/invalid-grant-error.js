'use strict';

/**
 * Module dependencies.
 */

import OAuthError from './oauth-error.js';

/**
 * Constructor.
 *
 * "The provided authorization grant (e.g., authorization code, resource owner credentials)
 * or refresh token is invalid, expired, revoked, does not match the redirection URI used
 * in the authorization request, or was issued to another client."
 *
 * @see https://tools.ietf.org/html/rfc6749#section-5.2
 */

export default class InvalidGrantError extends OAuthError {
  constructor(message, properties) {
    properties = {
      code: 400,
      name: 'invalid_grant',
      ...properties
    };

    super(message, properties);
  }
}
