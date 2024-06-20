'use strict';

/**
 * Module dependencies.
 */

import OAuthError from './oauth-error.js';

/**
 * Constructor.
 *
 * "The request is missing a required parameter, includes an invalid parameter value,
 * includes a parameter more than once, or is otherwise malformed."
 *
 * @see https://tools.ietf.org/html/rfc6749#section-4.2.2.1
 */

export default class InvalidRequest extends OAuthError {
  constructor(message, properties) {
    properties = {
      code: 400,
      name: 'invalid_request',
      ...properties
    };

    super(message, properties);
  }
}
