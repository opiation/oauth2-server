import isFormat from '@node-oauth/formats';
import InvalidScopeError from '../errors/invalid-scope-error.js';

const whiteSpace = /\s+/g;

export function parseScope(requestedScope) {
  if (requestedScope == null) {
    return undefined;
  }

  if (typeof requestedScope !== 'string') {
    throw new InvalidScopeError('Invalid parameter: `scope`');
  }

  // XXX: this prevents spaced-only strings to become
  // treated as valid nqchar by making them empty strings
  requestedScope = requestedScope.trim();

  if (!isFormat.nqschar(requestedScope)) {
    throw new InvalidScopeError('Invalid parameter: `scope`');
  }

  return requestedScope.split(whiteSpace);
}
