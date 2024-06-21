declare namespace Chai {
  interface Assertion {
    /**
     * Is the value under test a valid SHA256 hash (64-character hex string)?
     */
    sha256(): Assertion;
  }
}
