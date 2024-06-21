'use strict';

/**
 * Module dependencies.
 */

import pkce from '../../../lib/pkce/pkce.js';
import { base64URLEncode } from '../../../lib/utils/string-util.js';
import { createHash } from '../../../lib/utils/crypto-util.js';
import { describe, expect, it } from '../../test-utils.js';

describe('PKCE', function () {
  describe(pkce.isPKCERequest.name, function () {
    it('returns, whether parameters define a PKCE request', function () {
      [
        [true, 'authorization_code', 'foo'],
        [
          true,
          'authorization_code',
          '123123123123123123123123123123123123123123123'
        ],
        [false, 'authorization_code', ''],
        [false, 'authorization_code', undefined],
        [false, 'foo_code', '123123123123123123123123123123123123123123123'],
        [false, '', '123123123123123123123123123123123123123123123'],
        [false, undefined, '123123123123123123123123123123123123123123123'],
        [false, 'foo_code', 'bar']
      ].forEach((triple) => {
        expect(triple[0]).to.equal(
          pkce.isPKCERequest({
            grantType: triple[1],
            codeVerifier: triple[2]
          })
        );
      });
    });
  });
  describe(pkce.codeChallengeMatchesABNF.name, function () {
    it('returns whether a string matches the criteria for codeChallenge', function () {
      [
        [false, undefined],
        [false, null],
        [false, ''],
        [false, '123123123112312312311231231231123123123112'], // too short
        [false, '123123123112312312311231231231123123123112+'], // invalid chars
        [
          false,
          '123123123112312312311231231231123123123112312312311231231231123123123112312312311231231231123123123112312312311231231231123123123'
        ], // too long
        // invalid chars
        [
          true,
          '-_.~abcdefghijklmnopqrstuvwxyz0123456789ABCDEFHIJKLMNOPQRSTUVWXYZ'
        ]
      ].forEach((pair) => {
        expect(pair[0]).equal(pkce.codeChallengeMatchesABNF(pair[1]));
      });
    });
  });

  describe(pkce.getHashForCodeChallenge.name, function () {
    it('returns nothing if method is not valid', function () {
      const verifier =
        '-_.~abcdefghijklmnopqrstuvwxyz0123456789ABCDEFHIJKLMNOPQRSTUVWXYZ';

      [
        [undefined, undefined, verifier],
        [undefined, null, verifier],
        [undefined, '', verifier],
        [undefined, 'foo', verifier]
      ].forEach((triple) => {
        expect(triple[0]).to.equal(
          pkce.getHashForCodeChallenge({
            method: triple[1],
            verifier: triple[2]
          })
        );
      });
    });

    it('return the verifier on plain and undefined on S256 if verifier is falsy', function () {
      [
        [undefined, 'plain', undefined],
        [undefined, 'S256', undefined],
        [undefined, 'plain', ''],
        [undefined, 'S256', ''],
        [undefined, 'plain', null],
        [undefined, 'S256', null]
      ].forEach((triple) => {
        expect(triple[0]).to.equal(
          pkce.getHashForCodeChallenge({
            method: triple[1],
            verifier: triple[2]
          })
        );
      });
    });

    it('returns the unhashed verifier when method is plain', function () {
      const verifier =
        '-_.~abcdefghijklmnopqrstuvwxyz0123456789ABCDEFHIJKLMNOPQRSTUVWXYZ';
      const hash = pkce.getHashForCodeChallenge({ method: 'plain', verifier });
      expect(hash).to.equal(verifier);
    });

    it('returns the hash verifier when method is S256', function () {
      const verifier =
        '-_.~abcdefghijklmnopqrstuvwxyz0123456789ABCDEFHIJKLMNOPQRSTUVWXYZ';
      const hash = pkce.getHashForCodeChallenge({ method: 'S256', verifier });
      const expectedHash = base64URLEncode(createHash({ data: verifier }));
      expect(hash).to.equal(expectedHash);
    });
  });

  describe(pkce.isValidMethod.name, function () {
    it('returns if a method is plain or S256', function () {
      expect(pkce.isValidMethod('plain')).to.be.true;
      expect(pkce.isValidMethod('S256')).to.be.true;
      expect(pkce.isValidMethod('foo')).to.be.false;
      expect(pkce.isValidMethod()).to.be.false;
    });
  });
});
