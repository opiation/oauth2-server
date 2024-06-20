'use strict';

/**
 * Module dependencies.
 */
import InvalidArgumentError from '../errors/invalid-argument-error.js';
import { getLifetimeFromExpiresAt } from '../utils/date-util.js';

/**
 * The core model attributes allowed when allowExtendedTokenAttributes is false.
 */
const modelAttributes = new Set([
  'accessToken',
  'accessTokenExpiresAt',
  'refreshToken',
  'refreshTokenExpiresAt',
  'scope',
  'client',
  'user'
]);

export default class TokenModel {
  constructor(data = {}, options = {}) {
    const {
      accessToken,
      accessTokenExpiresAt,
      refreshToken,
      refreshTokenExpiresAt,
      scope,
      client,
      user
    } = data;

    if (!accessToken) {
      throw new InvalidArgumentError('Missing parameter: `accessToken`');
    }

    if (!client) {
      throw new InvalidArgumentError('Missing parameter: `client`');
    }

    if (!user) {
      throw new InvalidArgumentError('Missing parameter: `user`');
    }

    if (accessTokenExpiresAt && !(accessTokenExpiresAt instanceof Date)) {
      throw new InvalidArgumentError(
        'Invalid parameter: `accessTokenExpiresAt`'
      );
    }

    if (refreshTokenExpiresAt && !(refreshTokenExpiresAt instanceof Date)) {
      throw new InvalidArgumentError(
        'Invalid parameter: `refreshTokenExpiresAt`'
      );
    }

    this.accessToken = accessToken;
    this.accessTokenExpiresAt = accessTokenExpiresAt;
    this.client = client;
    this.refreshToken = refreshToken;
    this.refreshTokenExpiresAt = refreshTokenExpiresAt;
    this.scope = scope;
    this.user = user;

    if (accessTokenExpiresAt) {
      this.accessTokenLifetime = getLifetimeFromExpiresAt(accessTokenExpiresAt);
    }

    const { allowExtendedTokenAttributes } = options;

    if (allowExtendedTokenAttributes) {
      this.customAttributes = {};

      Object.keys(data).forEach((key) => {
        if (!modelAttributes.has(key)) {
          this.customAttributes[key] = data[key];
        }
      });
    }
  }
}
