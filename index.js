'use strict';

/**
 * Expose server and request/response classes.
 */

import Request from './lib/request.js';
import Response from './lib/response.js';
export { Request, Response };

/**
 * Export helpers for extension grants.
 */

import AbstractGrantType from './lib/grant-types/abstract-grant-type.js';
export { AbstractGrantType };

/**
 * Export error classes.
 */

import AccessDeniedError from './lib/errors/access-denied-error.js';
import InsufficientScopeError from './lib/errors/insufficient-scope-error.js';
import InvalidArgumentError from './lib/errors/invalid-argument-error.js';
import InvalidClientError from './lib/errors/invalid-client-error.js';
import InvalidGrantError from './lib/errors/invalid-grant-error.js';
import InvalidRequestError from './lib/errors/invalid-request-error.js';
import InvalidScopeError from './lib/errors/invalid-scope-error.js';
import InvalidTokenError from './lib/errors/invalid-token-error.js';
import OAuthError from './lib/errors/oauth-error.js';
import ServerError from './lib/errors/server-error.js';
import UnauthorizedClientError from './lib/errors/unauthorized-client-error.js';
import UnauthorizedRequestError from './lib/errors/unauthorized-request-error.js';
import UnsupportedGrantTypeError from './lib/errors/unsupported-grant-type-error.js';
import UnsupportedResponseTypeError from './lib/errors/unsupported-response-type-error.js';
import OAuth2Server from './lib/server.js';
export {
  AccessDeniedError,
  InsufficientScopeError,
  InvalidArgumentError,
  InvalidClientError,
  InvalidGrantError,
  InvalidRequestError,
  InvalidScopeError,
  InvalidTokenError,
  OAuthError,
  ServerError,
  UnauthorizedClientError,
  UnauthorizedRequestError,
  UnsupportedGrantTypeError,
  UnsupportedResponseTypeError,
};

export default OAuth2Server;
