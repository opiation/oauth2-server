export { afterEach, beforeEach, describe, it } from 'mocha';
export { expect } from 'chai';
export { default as sinon } from 'sinon';

import Chai from 'chai';

/**
 * SHA-256 assertion.
 */
/// <reference path="./assertions.d.ts" />
Chai.use(function (_chai, utils) {
  Chai.Assertion.addMethod('sha256', function (...args) {
    const obj = utils.flag(this, 'object');
    new Chai.Assertion(obj).match(/^[a-f0-9]{64}$/i);
  });
});
