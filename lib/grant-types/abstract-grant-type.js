'use strict';

/**
 * Module dependencies.
 */

import InvalidArgumentError from '../errors/invalid-argument-error.js';
import InvalidScopeError from '../errors/invalid-scope-error.js';
import { generateRandomToken } from '../utils/token-util.js';
import { parseScope } from '../utils/scope-util.js';

export default class AbstractGrantType {
  constructor(options) {
    options = options || {};

    if (!options.accessTokenLifetime) {
      throw new InvalidArgumentError(
        'Missing parameter: `accessTokenLifetime`'
      );
    }

    if (!options.model) {
      throw new InvalidArgumentError('Missing parameter: `model`');
    }

    this.accessTokenLifetime = options.accessTokenLifetime;
    this.model = options.model;
    this.refreshTokenLifetime = options.refreshTokenLifetime;
    this.alwaysIssueNewRefreshToken = options.alwaysIssueNewRefreshToken;
  }

  /**
   * Generate access token.
   */
  async generateAccessToken(client, user, scope) {
    if (this.model.generateAccessToken) {
      // We should not fall back to a random accessToken, if the model did not
      // return a token, in order to prevent unintended token-issuing.
      return this.model.generateAccessToken(client, user, scope);
    }

    return generateRandomToken();
  }

  /**
   * Generate refresh token.
   */
  async generateRefreshToken(client, user, scope) {
    if (this.model.generateRefreshToken) {
      // We should not fall back to a random refreshToken, if the model did not
      // return a token, in order to prevent unintended token-issuing.
      return this.model.generateRefreshToken(client, user, scope);
    }

    return generateRandomToken();
  }

  /**
   * Get access token expiration date.
   */
  getAccessTokenExpiresAt() {
    return new Date(Date.now() + this.accessTokenLifetime * 1000);
  }

  /**
   * Get refresh token expiration date.
   */
  getRefreshTokenExpiresAt() {
    return new Date(Date.now() + this.refreshTokenLifetime * 1000);
  }

  /**
   * Get scope from the request body.
   */
  getScope(request) {
    return parseScope(request.body.scope);
  }

  /**
   * Validate requested scope.
   */
  async validateScope(user, client, scope) {
    if (this.model.validateScope) {
      const validatedScope = await this.model.validateScope(
        user,
        client,
        scope
      );

      if (!validatedScope) {
        throw new InvalidScopeError(
          'Invalid scope: Requested scope is invalid'
        );
      }

      return validatedScope;
    } else {
      return scope;
    }
  }
}
