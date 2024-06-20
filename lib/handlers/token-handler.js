'use strict';

/**
 * Module dependencies.
 */

import BearerTokenType from '../token-types/bearer-token-type.js';
import InvalidArgumentError from '../errors/invalid-argument-error.js';
import InvalidClientError from '../errors/invalid-client-error.js';
import InvalidRequestError from '../errors/invalid-request-error.js';
import OAuthError from '../errors/oauth-error.js';
import Request from '../request.js';
import Response from '../response.js';
import ServerError from '../errors/server-error.js';
import TokenModel from '../models/token-model.js';
import UnauthorizedClientError from '../errors/unauthorized-client-error.js';
import UnsupportedGrantTypeError from '../errors/unsupported-grant-type-error.js';
import auth from 'basic-auth';
import pkce from '../pkce/pkce.js';
import isFormat from '@node-oauth/formats';

import AuthorizationCodeGrantType from '../grant-types/authorization-code-grant-type.js';
import ClientCredentialsGrantType from '../grant-types/client-credentials-grant-type.js';
import PasswordGrantType from '../grant-types/password-grant-type.js';
import RefreshTokenGrantType from '../grant-types/refresh-token-grant-type.js';

/**
 * Grant types.
 */

const grantTypes = {
  authorization_code: AuthorizationCodeGrantType,
  client_credentials: ClientCredentialsGrantType,
  password: PasswordGrantType,
  refresh_token: RefreshTokenGrantType
};

/**
 * Constructor.
 */

export default class TokenHandler {
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

    if (!options.refreshTokenLifetime) {
      throw new InvalidArgumentError(
        'Missing parameter: `refreshTokenLifetime`'
      );
    }

    if (!options.model.getClient) {
      throw new InvalidArgumentError(
        'Invalid argument: model does not implement `getClient()`'
      );
    }

    this.accessTokenLifetime = options.accessTokenLifetime;
    this.grantTypes = Object.assign({}, grantTypes, options.extendedGrantTypes);
    this.model = options.model;
    this.refreshTokenLifetime = options.refreshTokenLifetime;
    this.allowExtendedTokenAttributes = options.allowExtendedTokenAttributes;
    this.requireClientAuthentication =
      options.requireClientAuthentication || {};
    this.alwaysIssueNewRefreshToken =
      options.alwaysIssueNewRefreshToken !== false;
  }

  /**
   * Token Handler.
   */

  async handle(request, response) {
    if (!(request instanceof Request)) {
      throw new InvalidArgumentError(
        'Invalid argument: `request` must be an instance of Request'
      );
    }

    if (!(response instanceof Response)) {
      throw new InvalidArgumentError(
        'Invalid argument: `response` must be an instance of Response'
      );
    }

    if (request.method !== 'POST') {
      throw new InvalidRequestError('Invalid request: method must be POST');
    }

    if (!request.is('application/x-www-form-urlencoded')) {
      throw new InvalidRequestError(
        'Invalid request: content must be application/x-www-form-urlencoded'
      );
    }

    try {
      const client = await this.getClient(request, response);
      const data = await this.handleGrantType(request, client);
      const model = new TokenModel(data, {
        allowExtendedTokenAttributes: this.allowExtendedTokenAttributes
      });
      const tokenType = this.getTokenType(model);

      this.updateSuccessResponse(response, tokenType);

      return data;
    } catch (err) {
      let e = err;

      if (!(e instanceof OAuthError)) {
        e = new ServerError(e);
      }

      this.updateErrorResponse(response, e);
      throw e;
    }
  }

  /**
   * Get the client from the model.
   */

  async getClient(request, response) {
    const credentials = await this.getClientCredentials(request);
    const grantType = request.body.grant_type;
    const codeVerifier = request.body.code_verifier;
    const isPkce = pkce.isPKCERequest({ grantType, codeVerifier });

    if (!credentials.clientId) {
      throw new InvalidRequestError('Missing parameter: `client_id`');
    }

    if (
      this.isClientAuthenticationRequired(grantType) &&
      !credentials.clientSecret &&
      !isPkce
    ) {
      throw new InvalidRequestError('Missing parameter: `client_secret`');
    }

    if (!isFormat.vschar(credentials.clientId)) {
      throw new InvalidRequestError('Invalid parameter: `client_id`');
    }

    if (
      credentials.clientSecret &&
      !isFormat.vschar(credentials.clientSecret)
    ) {
      throw new InvalidRequestError('Invalid parameter: `client_secret`');
    }

    try {
      const client = await this.model.getClient(
        credentials.clientId,
        credentials.clientSecret
      );

      if (!client) {
        throw new InvalidClientError('Invalid client: client is invalid');
      }

      if (!client.grants) {
        throw new ServerError('Server error: missing client `grants`');
      }

      if (!(client.grants instanceof Array)) {
        throw new ServerError('Server error: `grants` must be an array');
      }

      return client;
    } catch (e) {
      // Include the "WWW-Authenticate" response header field if the client
      // attempted to authenticate via the "Authorization" request header.
      //
      // @see https://tools.ietf.org/html/rfc6749#section-5.2.
      if (e instanceof InvalidClientError && request.get('authorization')) {
        response.set('WWW-Authenticate', 'Basic realm="Service"');
        throw new InvalidClientError(e, { code: 401 });
      }

      throw e;
    }
  }

  /**
   * Get client credentials.
   *
   * The client credentials may be sent using the HTTP Basic authentication scheme or, alternatively,
   * the `client_id` and `client_secret` can be embedded in the body.
   *
   * @see https://tools.ietf.org/html/rfc6749#section-2.3.1
   */

  getClientCredentials(request) {
    const credentials = auth(request);
    const grantType = request.body.grant_type;
    const codeVerifier = request.body.code_verifier;

    if (credentials) {
      return { clientId: credentials.name, clientSecret: credentials.pass };
    }

    if (request.body.client_id && request.body.client_secret) {
      return {
        clientId: request.body.client_id,
        clientSecret: request.body.client_secret
      };
    }

    if (pkce.isPKCERequest({ grantType, codeVerifier })) {
      if (request.body.client_id) {
        return { clientId: request.body.client_id };
      }
    }

    if (!this.isClientAuthenticationRequired(grantType)) {
      if (request.body.client_id) {
        return { clientId: request.body.client_id };
      }
    }

    throw new InvalidClientError(
      'Invalid client: cannot retrieve client credentials'
    );
  }

  /**
   * Handle grant type.
   */

  async handleGrantType(request, client) {
    const grantType = request.body.grant_type;

    if (!grantType) {
      throw new InvalidRequestError('Missing parameter: `grant_type`');
    }

    if (!isFormat.nchar(grantType) && !isFormat.uri(grantType)) {
      throw new InvalidRequestError('Invalid parameter: `grant_type`');
    }

    if (!Object.prototype.hasOwnProperty.call(this.grantTypes, grantType)) {
      throw new UnsupportedGrantTypeError(
        'Unsupported grant type: `grant_type` is invalid'
      );
    }

    if (!Array.isArray(client.grants) || !client.grants.includes(grantType)) {
      throw new UnauthorizedClientError(
        'Unauthorized client: `grant_type` is invalid'
      );
    }

    const accessTokenLifetime = this.getAccessTokenLifetime(client);
    const refreshTokenLifetime = this.getRefreshTokenLifetime(client);
    const Type = this.grantTypes[grantType];

    const options = {
      accessTokenLifetime: accessTokenLifetime,
      model: this.model,
      refreshTokenLifetime: refreshTokenLifetime,
      alwaysIssueNewRefreshToken: this.alwaysIssueNewRefreshToken
    };

    return new Type(options).handle(request, client);
  }

  /**
   * Get access token lifetime.
   */

  getAccessTokenLifetime(client) {
    return client.accessTokenLifetime || this.accessTokenLifetime;
  }

  /**
   * Get refresh token lifetime.
   */

  getRefreshTokenLifetime(client) {
    return client.refreshTokenLifetime || this.refreshTokenLifetime;
  }

  /**
   * Get token type.
   */

  getTokenType(model) {
    return new BearerTokenType(
      model.accessToken,
      model.accessTokenLifetime,
      model.refreshToken,
      model.scope,
      model.customAttributes
    );
  }

  /**
   * Update response when a token is generated.
   */

  updateSuccessResponse(response, tokenType) {
    response.body = tokenType.valueOf();

    // for compliance reasons we rebuild the internal scope to be a string
    // https://datatracker.ietf.org/doc/html/rfc6749.html#section-5.1
    if (response.body.scope) {
      response.body.scope = response.body.scope.join(' ');
    }

    response.set('Cache-Control', 'no-store');
    response.set('Pragma', 'no-cache');
  }

  /**
   * Update response when an error is thrown.
   */

  updateErrorResponse(response, error) {
    response.body = {
      error: error.name,
      error_description: error.message
    };

    response.status = error.code;
  }

  /**
   * Given a grant type, check if client authentication is required
   */
  isClientAuthenticationRequired(grantType) {
    if (Object.keys(this.requireClientAuthentication).length > 0) {
      return typeof this.requireClientAuthentication[grantType] !== 'undefined'
        ? this.requireClientAuthentication[grantType]
        : true;
    } else {
      return true;
    }
  }
}
