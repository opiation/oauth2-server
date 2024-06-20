'use strict';

/**
 * Module dependencies.
 */

import OAuthError from './oauth-error.js';

/**
 * Constructor.
 */

export default class InvalidArgumentError extends OAuthError {
  constructor(message, properties) {
    properties = {
      code: 500,
      name: 'invalid_argument',
      ...properties
    };

    super(message, properties);
  }
}
