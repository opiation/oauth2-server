import { getLifetimeFromExpiresAt } from '../../../lib/utils/date-util.js';
import { beforeEach, describe, expect, it, sinon } from '../../test-utils.js';

describe('DateUtil', function () {
  describe('getLifetimeFromExpiresAt', () => {
    const now = new Date('2023-01-01T00:00:00.000Z');

    beforeEach(() => {
      sinon.useFakeTimers(now);
    });

    it('converts a valid expiration date into seconds from now', () => {
      const expiresAt = new Date('2023-01-01T00:00:10.000Z');
      const lifetime = getLifetimeFromExpiresAt(expiresAt);

      expect(lifetime).to.be.a('number');
      expect(lifetime).to.be.approximately(10, 2);
    });

    afterEach(() => {
      sinon.restore();
    });
  });
});
