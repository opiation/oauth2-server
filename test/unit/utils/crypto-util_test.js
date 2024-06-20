import { createHash } from '../../../lib/utils/crypto-util.js';
import Chai from 'chai';
Chai.should();

describe(createHash.name, function () {
  it('creates a hash by given algorithm', function () {
    const data = 'client-credentials-grant';
    const hash = createHash({ data, encoding: 'hex' });
    hash.should.equal(
      '072726830f0aadd2d91f86f53e3a7ef40018c2626438152dd576e272bf2b8e60'
    );
  });
  it('should throw if data is missing', function () {
    try {
      createHash({});
    } catch (e) {
      e.should.be.instanceOf(TypeError);
      e.message.should.include(
        'he "data" argument must be of type string or an instance of Buffer, TypedArray, or DataView.'
      );
    }
  });
});
