import { getLifetimeFromExpiresAt } from '../../../lib/utils/date-util.js';

import sinon from 'sinon';
import Chai from 'chai';
Chai.should();

describe('DateUtil', function () {
  describe('getLifetimeFromExpiresAt', () => {
    const now = new Date('2023-01-01T00:00:00.000Z');

    beforeEach(() => {
      sinon.useFakeTimers(now);
    });

    it('should convert a valid expiration date into seconds from now', () => {
      const expiresAt = new Date('2023-01-01T00:00:10.000Z');
      const lifetime = getLifetimeFromExpiresAt(expiresAt);

      lifetime.should.be.a('number');
      lifetime.should.be.approximately(10, 2);
    });

    afterEach(() => {
      sinon.restore();
    });
  });
});
