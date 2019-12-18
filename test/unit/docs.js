const MockUser = require('../../src/user');

describe('API.md', () => {
  describe('Auth example for changeAuthState', () => {

    let ref;
    beforeEach(() => {
      const Authentication = require('../../').MockAuthentication;
      ref = new Authentication();
    });

    it('works as described', () => {
      ref.changeAuthState(new MockUser(ref, {
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

  describe('Messaging examples', () => {
    let ref;
    beforeEach(() => {
      const Messaging = require('../../').MockMessaging;
      ref = new Messaging();
    });

    it('send messages', () => {
      var message = {
        notification: {
          title: 'message title',
          body: 'foobar'
        }
      };
      var result = ref.send(message);
      ref.flush();
      result.then(function (messageId) {
        console.assert(messageId !== '', 'message id is ' + messageId);
      });
    });

    it('returns custom message responses', () => {
      var messages = [
        {
          notification: {
            title: 'message title',
            body: 'foobar'
          }
        },
        {
          notification: {
            title: 'message title',
            body: 'second message'
          }
        }
      ];
      var batchResponse = {
        failureCount: 1,
        responses: [
            {
                error: "something went wrong",
                success: false,
            },
            {
                messageId: "12345",
                success: true,
            },
        ],
        successCount: 1,
    }
      var result = ref.respondNext('sendAll', batchResponse);
      ref.sendAll(messages);
      ref.flush();
      result.then(function (response) {
        console.assert(response === batchResponse, 'custom batch response is returned');
      });
    });

    it('callback on sending messages', () => {
      var message = {
        notification: {
          title: 'message title',
          body: 'foobar'
        }
      };
      ref.on('send', function(args) {
        console.assert(args[0] === message, 'message argument is coorect');
      });
      ref.send(message);
      ref.flush();
    });
  });
});
