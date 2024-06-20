'use strict';

/**
 * Module dependencies.
 */

import chai from 'chai';

/**
 * SHA-256 assertion.
 */

chai.use(function (_chai, utils) {
  chai.Assertion.addMethod('sha256', function (...args) {
    const obj = utils.flag(this, 'object');
    new chai.Assertion(obj).match(/^[a-f0-9]{64}$/i);
  });
});
