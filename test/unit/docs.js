const User = require('../../src/user');

describe('API.md', () => {
  describe('Auth example for', () => {

    let ref;
    beforeEach(() => {
      const Authentication = require('../../').MockAuthentication;
      ref = new Authentication();
    });

    it('changeAuthState works as described', () => {
      ref.changeAuthState(new User(ref, {
        uid: 'theUid',
        email: 'me@example.com',
        emailVerified: true,
        displayName: 'Mr. Meeseeks',
        phoneNumber: '+1-508-123-4567',
        photoURL: 'https://example.com/image.png',
        isAnonymous: false,
        providerId: 'github',
        providerData: [],
        refreshToken: '123e4567-e89b-12d3-a456-426655440000',
        metadata: {},  // firebase-mock offers limited support for this field
        customClaims: {
          isAdmin: true,
          // etc.
        },
        _idtoken: 'theToken',
        _tokenValidity: {
          authTime: '2019-11-22T08:46:15Z',
          issuedAtTime: '2019-11-22T08:46:15Z',
          expirationTime: '2019-11-22T09:46:15Z',
        },
      }));
      ref.flush();
      console.assert(ref.getAuth().displayName === 'Mr. Meeseeks', 'Auth name is correct');
    });
  });
});
