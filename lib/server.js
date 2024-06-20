'use strict';

/**
 * Module dependencies.
 */

import AuthenticateHandler from './handlers/authenticate-handler.js';
import AuthorizeHandler from './handlers/authorize-handler.js';
import InvalidArgumentError from './errors/invalid-argument-error.js';
import TokenHandler from './handlers/token-handler.js';

/**
 * Constructor.
 */

export default class OAuth2Server {
  constructor(options) {
    options = options || {};

    if (!options.model) {
      throw new InvalidArgumentError('Missing parameter: `model`');
    }

    this.options = options;
  }

  /**
   * Authenticate a token.
   */

  authenticate(request, response, options) {
    options = Object.assign(
      {
        addAcceptedScopesHeader: true,
        addAuthorizedScopesHeader: true,
        allowBearerTokensInQueryString: false
      },
      this.options,
      options
    );

    return new AuthenticateHandler(options).handle(request, response);
  }

  /**
   * Authorize a request.
   */

  authorize(request, response, options) {
    options = Object.assign(
      {
        allowEmptyState: false,
        authorizationCodeLifetime: 5 * 60 // 5 minutes.
      },
      this.options,
      options
    );

    return new AuthorizeHandler(options).handle(request, response);
  }

  /**
   * Create a token.
   */

  token(request, response, options) {
    options = Object.assign(
      {
        accessTokenLifetime: 60 * 60, // 1 hour.
        refreshTokenLifetime: 60 * 60 * 24 * 14, // 2 weeks.
        allowExtendedTokenAttributes: false,
        requireClientAuthentication: {} // defaults to true for all grant types
      },
      this.options,
      options
    );

    return new TokenHandler(options).handle(request, response);
  }
}
