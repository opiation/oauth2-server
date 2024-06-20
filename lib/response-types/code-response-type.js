'use strict';

/**
 * Module dependencies.
 */

import InvalidArgumentError from '../errors/invalid-argument-error.js';
import url from 'node:url';

export default class CodeResponseType {
  constructor(code) {
    if (!code) {
      throw new InvalidArgumentError('Missing parameter: `code`');
    }

    this.code = code;
  }

  buildRedirectUri(redirectUri) {
    if (!redirectUri) {
      throw new InvalidArgumentError('Missing parameter: `redirectUri`');
    }

    const uri = url.parse(redirectUri, true);

    uri.query.code = this.code;
    uri.search = null;

    return uri;
  }
}
