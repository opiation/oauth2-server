/**
 * @see https://datatracker.ietf.org/doc/html/rfc6749#section-2.3.1
 *
 *   For example (with extra line breaks for display purposes only):
 *
 *     Authorization: Basic czZCaGRSa3F0Mzo3RmpmcDBaQnIxS3REUmJuZlZkbUl3
 *
 *   Alternatively, the authorization server MAY support including the
 *   client credentials in the request-body using the following
 *   parameters:
 *
 *   client_id
 *         REQUIRED.  The client identifier issued to the client during
 *         the registration process described by Section 2.2.
 *
 *   client_secret
 *         REQUIRED.  The client secret.  The client MAY omit the
 *         parameter if the client secret is an empty string.
 */

import OAuth2Server from '../../index.js';
import DB from '../helpers/db.js';
import createModel from '../helpers/model.js';
import createRequest from '../helpers/request.js';
import Response from '../../lib/response.js';

import { describe, expect, it } from '../test-utils.js';

const db = new DB();

const auth = new OAuth2Server({
  model: createModel(db),
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
      scope,
    },
    headers: {
      authorization:
        'Basic ' +
        Buffer.from(client.id + ':' + client.secret).toString('base64'),
      'content-type': 'application/x-www-form-urlencoded',
    },
    method: 'POST',
  });
}

describe('Client Authentication Compliance', function () {
  describe('No authentication', function () {
    it('returns an invalid_client error', async function () {
      const request = createDefaultRequest();
      const response = new Response({});

      delete request.headers.authorization;

      await auth
        .token(request, response, {})
        .then((token) => {
          throw new Error('Should not be here');
        })
        .catch((err) => {
          expect(err.name).to.equal('invalid_client');
        });
    });
  });

  describe('Basic Authentication', function () {
    it('returns a token with the successful authentication', async function () {
      const request = createDefaultRequest();
      const response = new Response({});

      await auth.token(request, response, {});
    });

    it('returns an invalid_client error', async function () {
      const request = createDefaultRequest();
      const response = new Response({});

      request.headers.authorization =
        'Basic ' + Buffer.from('a:c').toString('base64');

      await auth
        .token(request, response, {})
        .then((token) => {
          throw new Error('Should not be here');
        })
        .catch((err) => {
          expect(err.name).to.equal('invalid_client');
        });
    });
  });

  describe('Request body authentication', function () {
    it('returns a token with the successful authentication', async function () {
      const request = createDefaultRequest();
      const response = new Response({});

      delete request.headers.authorization;

      request.body.client_id = client.id;
      request.body.client_secret = client.secret;

      await auth.token(request, response, {});
    });

    it('returns an invalid_client error', async function () {
      const request = createDefaultRequest();
      const response = new Response({});

      delete request.headers.authorization;

      request.body.client_id = 'a';
      request.body.client_secret = 'c';

      await auth
        .token(request, response, {})
        .then((token) => {
          throw new Error('Should not be here');
        })
        .catch((err) => {
          expect(err.name).to.equal('invalid_client');
        });
    });
  });
});
