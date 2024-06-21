/**
 * Request
 * @see https://datatracker.ietf.org/doc/html/rfc6749#section-4.3.2
 *
 * grant_type
 *      REQUIRED.  Value MUST be set to "password".
 * username
 *      REQUIRED.  The resource owner username.
 * password
 *      REQUIRED.  The resource owner password.
 * scope
 *      OPTIONAL.  The scope of the access request as described by Section 3.3.
 */

/**
 * Response
 * @see https://datatracker.ietf.org/doc/html/rfc6749#section-5.1
 *
 *   access_token
 *         REQUIRED.  The access token issued by the authorization server.
 *   token_type
 *         REQUIRED.  The type of the token issued as described in
 *         Section 7.1.  Value is case insensitive.
 *   expires_in
 *         RECOMMENDED.  The lifetime in seconds of the access token.  For
 *         example, the value "3600" denotes that the access token will
 *         expire in one hour from the time the response was generated.
 *         If omitted, the authorization server SHOULD provide the
 *         expiration time via other means or document the default value.
 *   refresh_token
 *         OPTIONAL.  The refresh token, which can be used to obtain new
 *         access tokens using the same authorization grant as described
 *         in Section 6.
 *   scope
 *         OPTIONAL, if identical to the scope requested by the client;
 *         otherwise, REQUIRED.  The scope of the access token as
 *         described by Section 3.3.
 */

/**
 * Response (error)
 * @see https://datatracker.ietf.org/doc/html/rfc6749#section-5.2
 *
 *   error
 *         REQUIRED.  A single ASCII [USASCII] error code from the following:
 *         invalid_request, invalid_client, invalid_grant
 *         unauthorized_client, unsupported_grant_type, invalid_scope
 *   error_description
 *         OPTIONAL.  Human-readable ASCII [USASCII] text providing
 *         additional information, used to assist the client developer in
 *         understanding the error that occurred.
 *   error_uri
 *         OPTIONAL.  A URI identifying a human-readable web page with
 *         information about the error, used to provide the client
 *         developer with additional information about the error.
 */

import OAuth2Server from '../../index.js';
import DB from '../helpers/db.js';
import createModel from '../helpers/model.js';
import createRequest from '../helpers/request.js';
import Response from '../../lib/response.js';
import crypto from 'node:crypto';
import { describe, expect, it } from '../test-utils.js';

const db = new DB();

const auth = new OAuth2Server({
  model: createModel(db)
});

const user = db.saveUser({ id: 1, username: 'test', password: 'test' });
const client = db.saveClient({ id: 'a', secret: 'b', grants: ['password'] });
const scope = 'read write';

function createDefaultRequest() {
  return createRequest({
    body: {
      grant_type: 'password',
      username: user.username,
      password: user.password,
      scope
    },
    headers: {
      authorization:
        'Basic ' +
        Buffer.from(client.id + ':' + client.secret).toString('base64'),
      'content-type': 'application/x-www-form-urlencoded'
    },
    method: 'POST'
  });
}

describe('PasswordGrantType Compliance', function () {
  describe('Authenticate', function () {
    it('Succesfull authorization', async function () {
      const request = createDefaultRequest();
      const response = new Response({});

      const token = await auth.token(request, response, {});
      expect(response.body.token_type).to.equal('Bearer');
      expect(response.body.access_token).to.equal(token.accessToken);
      expect(response.body.refresh_token).to.equal(token.refreshToken);
      expect(response.body.expires_in).to.be.a('number');
      expect(response.body.scope).to.eql('read write');

      expect(token.accessToken).to.be.a('string');
      expect(token.refreshToken).to.be.a('string');
      expect(token.accessTokenExpiresAt).to.be.a('date');
      expect(token.refreshTokenExpiresAt).to.be.a('date');
      expect(token.scope).to.eql(['read', 'write']);

      expect(db.accessTokens.has(token.accessToken)).to.equal(true);
      expect(db.refreshTokens.has(token.refreshToken)).to.equal(true);
    });

    it('Succesfull authorization and authentication', async function () {
      const tokenRequest = createDefaultRequest();
      const tokenResponse = new Response({});

      const token = await auth.token(tokenRequest, tokenResponse, {});

      const authenticationRequest = createRequest({
        body: {},
        headers: {
          Authorization: `Bearer ${token.accessToken}`
        },
        method: 'GET',
        query: {}
      });
      const authenticationResponse = new Response({});

      const authenticated = await auth.authenticate(
        authenticationRequest,
        authenticationResponse,
        {}
      );

      expect(authenticated.scope).to.eql(['read', 'write']);
      expect(authenticated.user).to.be.an('object');
      expect(authenticated.client).to.be.an('object');
    });

    it('Username missing', async function () {
      const request = createDefaultRequest();
      const response = new Response({});

      delete request.body.username;

      await auth.token(request, response, {}).catch((err) => {
        expect(err.name).to.equal('invalid_request');
      });
    });

    it('Password missing', async function () {
      const request = createDefaultRequest();
      const response = new Response({});

      delete request.body.password;

      await auth.token(request, response, {}).catch((err) => {
        expect(err.name).to.equal('invalid_request');
      });
    });

    it('Wrong username', async function () {
      const request = createDefaultRequest();
      const response = new Response({});

      request.body.username = 'wrong';

      await auth.token(request, response, {}).catch((err) => {
        expect(err.name).to.equal('invalid_grant');
      });
    });

    it('Wrong password', async function () {
      const request = createDefaultRequest();
      const response = new Response({});

      request.body.password = 'wrong';

      await auth.token(request, response, {}).catch((err) => {
        expect(err.name).to.equal('invalid_grant');
      });
    });

    it('Client not found', async function () {
      const request = createDefaultRequest();
      const response = new Response({});

      const clientId = crypto.randomBytes(4).toString('hex');
      const clientSecret = crypto.randomBytes(4).toString('hex');

      request.headers.authorization =
        'Basic ' +
        Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

      await auth.token(request, response, {}).catch((err) => {
        expect(err.name).to.equal('invalid_client');
      });
    });

    it('Client secret not required', async function () {
      const request = createDefaultRequest();
      const response = new Response({});

      delete request.body.client_secret;

      const token = await auth.token(request, response, {
        requireClientAuthentication: {
          password: false
        }
      });

      expect(token.accessToken).to.be.a('string');
    });

    it('Client secret required', async function () {
      const request = createDefaultRequest();
      const response = new Response({});

      delete request.body.client_secret;

      await auth
        .token(request, response, {
          requireClientAuthentication: {
            password: false
          }
        })
        .catch((err) => {
          expect(err.name).to.equal('invalid_client');
        });
    });
  });
});
