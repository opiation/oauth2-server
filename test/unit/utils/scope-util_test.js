import { parseScope } from '../../../lib/utils/scope-util.js';
import { describe, expect, it } from '../../test-utils.js';

describe(parseScope.name, () => {
  it('returns undefined on nullish values', () => {
    const values = [undefined, null];
    values.forEach((str) => {
      expect(parseScope(str)).to.be.undefined;
    });
  });

  it('throws on non-string values', () => {
    const invalid = [
      1,
      -1,
      true,
      false,
      {},
      ['foo'],
      [],
      () => {},
      Symbol('foo')
    ];
    invalid.forEach((str) => {
      try {
        parseScope(str);
        expect.fail();
      } catch (e) {
        expect(e.message).to.eql('Invalid parameter: `scope`');
      }
    });
  });

  it('throws on empty strings', () => {
    const invalid = ['', ' ', '      ', '\n', '\t', '\r'];
    invalid.forEach((str) => {
      try {
        parseScope(str);
        expect.fail();
      } catch (e) {
        expect(e.message).to.eql('Invalid parameter: `scope`');
      }
    });
  });

  it('splits space-delimited strings into arrays', () => {
    const values = [
      ['foo', ['foo']],
      ['foo bar', ['foo', 'bar']],
      ['foo       bar', ['foo', 'bar']]
    ];

    values.forEach(([str, compare]) => {
      expect(parseScope(str)).to.deep.equal(compare);
    });
  });
});
