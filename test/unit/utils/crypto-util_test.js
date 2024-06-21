import { createHash } from '../../../lib/utils/crypto-util.js';
import { describe, expect, it } from '../../test-utils.js';

describe(createHash.name, function () {
  it('creates a hash by given algorithm', function () {
    const data = 'client-credentials-grant';
    const hash = createHash({ data, encoding: 'hex' });
    expect(hash).to.equal(
      '072726830f0aadd2d91f86f53e3a7ef40018c2626438152dd576e272bf2b8e60'
    );
  });

  it('throws if data is missing', function () {
    try {
      createHash({});
    } catch (e) {
      expect(e).to.be.instanceOf(TypeError);
      expect(e.message).to.include(
        'he "data" argument must be of type string or an instance of Buffer, TypedArray, or DataView.'
      );
    }
  });
});
