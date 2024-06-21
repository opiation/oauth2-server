import TokenModel from '../../../lib/models/token-model.js';
import InvalidArgumentError from '../../../lib/errors/invalid-argument-error.js';
import { describe, expect, it } from '../../test-utils.js';

/**
 * Test `Server`.
 */

describe('Model', function () {
  describe('constructor()', function () {
    it('throws, if data is empty', function () {
      try {
        new TokenModel();
        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceOf(InvalidArgumentError);
        expect(e.message).to.equal('Missing parameter: `accessToken`');
      }
    });

    it('throws, if `accessToken` is missing', function () {
      const atExpiresAt = new Date();
      atExpiresAt.setHours(new Date().getHours() + 1);

      const data = {
        client: 'bar',
        user: 'tar',
        accessTokenExpiresAt: atExpiresAt
      };

      try {
        new TokenModel(data);
        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceOf(InvalidArgumentError);
        expect(e.message).to.equal('Missing parameter: `accessToken`');
      }
    });

    it('throws, if `client` is missing', function () {
      const atExpiresAt = new Date();
      atExpiresAt.setHours(new Date().getHours() + 1);

      const data = {
        accessToken: 'foo',
        user: 'tar',
        accessTokenExpiresAt: atExpiresAt
      };

      try {
        new TokenModel(data);
        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceOf(InvalidArgumentError);
        expect(e.message).to.equal('Missing parameter: `client`');
      }
    });

    it('throws, if `user` is missing', function () {
      const atExpiresAt = new Date();
      atExpiresAt.setHours(new Date().getHours() + 1);

      const data = {
        accessToken: 'foo',
        client: 'bar',
        accessTokenExpiresAt: atExpiresAt
      };

      try {
        new TokenModel(data);
        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceOf(InvalidArgumentError);
        expect(e.message).to.equal('Missing parameter: `user`');
      }
    });

    it('throws, if `accessTokenExpiresAt` is not a Date', function () {
      const data = {
        accessToken: 'foo',
        client: 'bar',
        user: 'tar',
        accessTokenExpiresAt: '11/10/2023'
      };

      try {
        new TokenModel(data);
        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceOf(InvalidArgumentError);
        expect(e.message).to.equal('Invalid parameter: `accessTokenExpiresAt`');
      }
    });

    it('throws, if `refreshTokenExpiresAt` is not a Date', function () {
      const data = {
        accessToken: 'foo',
        client: 'bar',
        user: 'tar',
        refreshTokenExpiresAt: '11/10/2023'
      };

      try {
        new TokenModel(data);
        expect.fail();
      } catch (e) {
        expect(e).to.be.an.instanceOf(InvalidArgumentError);
        expect(e.message).to.equal(
          'Invalid parameter: `refreshTokenExpiresAt`'
        );
      }
    });

    it('calculates `accessTokenLifetime` if `accessTokenExpiresAt` is set', function () {
      const atExpiresAt = new Date();
      atExpiresAt.setHours(new Date().getHours() + 1);

      const data = {
        accessToken: 'foo',
        client: 'bar',
        user: 'tar',
        accessTokenExpiresAt: atExpiresAt
      };

      const model = new TokenModel(data);
      expect(model.accessTokenLifetime).to.exist;
      expect(model.accessTokenLifetime).to.be.a('number');
      expect(model.accessTokenLifetime).to.be.approximately(3600, 2);
    });

    it('throws if the required arguments are not provided', () => {
      expect(() => {
        new TokenModel({});
      }).to.throw();
    });

    it('ignores custom attributes if allowExtendedTokenAttributes is not specified as true', () => {
      const model = new TokenModel({
        accessToken: 'token',
        client: 'client',
        user: 'user',
        myCustomAttribute: 'myCustomValue'
      });

      expect(model['myCustomAttribute']).not.to.exist;
      expect(model['customAttributes']).not.to.exist;
    });

    it('sets custom attributes on the customAttributes field if allowExtendedTokenAttributes is specified as true', () => {
      const model = new TokenModel(
        {
          accessToken: 'token',
          client: 'client',
          user: 'user',
          myCustomAttribute: 'myCustomValue'
        },
        {
          allowExtendedTokenAttributes: true
        }
      );

      expect(model['myCustomAttribute']).not.to.exist;
      expect(model['customAttributes']).to.be.an('object');
      expect(model['customAttributes']['myCustomAttribute']).to.equal(
        'myCustomValue'
      );
    });
  });
});
